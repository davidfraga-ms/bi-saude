import httpx
import re
import time
import asyncio
import logging
from typing import Dict, Any, List, Tuple, Optional
from fastapi import HTTPException
from models import RagDashboardData, Diretriz, Objetivo, Meta, Iniciativa, Subfuncao, DiagnosticoChamada

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("bi_saude")

IBGE_UF_MAP = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
    "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS",
    "50": "MS", "51": "MT", "52": "GO", "53": "DF"
}

NOMES_MUNICIPIOS_CONHECIDOS = {
    "355030": "São Paulo",
    "330455": "Rio de Janeiro",
    "292740": "Salvador",
    "260290": "Cabo de Santo Agostinho"
}

DIGISUS_BASE = "https://digisusgmp.saude.gov.br/v1.5/api"

CACHE_MEMORIA: Dict[str, Tuple[float, RagDashboardData]] = {}
CACHE_TTL_SEGUNDOS = 7200

def sanitizar_ibge(ibge_input: str) -> Tuple[str, str]:
    ibge_limpo = ibge_input.strip()

    if not re.fullmatch(r"^\d+$", ibge_limpo):
        raise HTTPException(status_code=400, detail="O código IBGE deve conter apenas números.")

    if len(ibge_limpo) == 7:
        ibge_6 = ibge_limpo[:6]
    elif len(ibge_limpo) == 6:
        ibge_6 = ibge_limpo
    else:
        raise HTTPException(status_code=400, detail=f"Código IBGE deve conter 6 ou 7 dígitos (recebido: {len(ibge_limpo)}).")

    prefixo_uf = ibge_6[:2]
    uf = IBGE_UF_MAP.get(prefixo_uf)
    if not uf:
        raise HTTPException(status_code=400, detail=f"Prefixo IBGE '{prefixo_uf}' não reconhecido.")

    return ibge_6, uf

def extrair_lista_de_resposta(dados: Any) -> List[Dict[str, Any]]:
    if isinstance(dados, list):
        return [d for d in dados if isinstance(d, dict)]

    if isinstance(dados, dict):
        chaves_prioritarias = [
            "diretrizes", "dados", "dadosMetas", "dadosOrcamentarios",
            "resultadoMetas", "metas", "itens", "lista", "data", "resultado"
        ]
        for cp in chaves_prioritarias:
            if cp in dados and isinstance(dados[cp], list) and len(dados[cp]) > 0:
                return [d for d in dados[cp] if isinstance(d, dict)]
            if cp in dados and isinstance(dados[cp], dict):
                sub = extrair_lista_de_resposta(dados[cp])
                if sub:
                    return sub

        for k, v in dados.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                return v

    return []

def get_field(item: dict, candidate_keys: list, default=None):
    norm_map = {re.sub(r"[_\-\s]", "", str(k).lower()): v for k, v in item.items()}
    for cand in candidate_keys:
        clean_cand = re.sub(r"[_\-\s]", "", cand.lower())
        if clean_cand in norm_map and norm_map[clean_cand] is not None:
            return norm_map[clean_cand]
    return default

def get_float(item: dict, candidate_keys: list, default: float = 0.0) -> float:
    val = get_field(item, candidate_keys)
    if val is not None:
        try:
            if isinstance(val, (int, float)):
                return float(val)
            s = str(val).strip().replace(".", "").replace(",", ".")
            return float(s)
        except (ValueError, TypeError):
            pass
    return default

def get_str(item: dict, candidate_keys: list, default: str = "") -> str:
    val = get_field(item, candidate_keys)
    if val is not None:
        s = str(val).strip()
        if s and s.lower() != "null":
            return s
    return default

async def _requisitar_endpoint(client: httpx.AsyncClient, servico: str, url: str) -> Tuple[str, str, int, float, int, Any, str]:
    t_inicio = time.time()
    print(f"📡 [DISPARANDO] {servico} -> {url}")
    try:
        response = await client.get(url)
        t_duracao = round((time.time() - t_inicio) * 1000, 2)
        status = response.status_code
        tamanho = len(response.content)

        print(f"📥 [CONCLUÍDO] {servico} | Status: {status} | Tempo: {t_duracao}ms | Tamanho: {tamanho}b")

        if status == 200:
            dados = response.json()
            return servico, url, status, t_duracao, tamanho, dados, "Sucesso"
        else:
            return servico, url, status, t_duracao, tamanho, None, f"Status HTTP {status}"
    except httpx.TimeoutException:
        t_duracao = round((time.time() - t_inicio) * 1000, 2)
        print(f"❌ [TIMEOUT] {servico} excedeu 90s.")
        return servico, url, 504, t_duracao, 0, None, "Timeout (>90s)"
    except Exception as ex:
        t_duracao = round((time.time() - t_inicio) * 1000, 2)
        print(f"❌ [ERRO] {servico}: {str(ex)}")
        return servico, url, 500, t_duracao, 0, None, str(ex)

def processar_hierarquia_rag(dados_rag: Any, dados_orcamento: Any) -> List[Diretriz]:
    diretrizes_brutas = extrair_lista_de_resposta(dados_rag)
    if not diretrizes_brutas:
        return []

    # Mapa de orçamentos por código da PAS
    orcamentos_pas = extrair_lista_de_resposta(dados_orcamento)
    orcamento_map: Dict[str, float] = {}
    for orc in orcamentos_pas:
        chave_orc = get_str(orc, ["coObjetivo", "coMeta", "coDiretriz", "co_meta", "id"])
        vl = get_float(orc, ["vlOrcamento", "vl_orcamento", "vlFinanceiro", "vlLiquidado"])
        if chave_orc and vl > 0:
            orcamento_map[chave_orc] = orcamento_map.get(chave_orc, 0.0) + vl

    diretrizes_finais: List[Diretriz] = []

    for d_idx, d in enumerate(diretrizes_brutas):
        dir_nome = get_str(d, ["dsDiretriz", "noDiretriz", "ds_diretriz", "no_diretriz", "nome"], f"Diretriz {d_idx + 1}")
        dir_cod = get_str(d, ["coDiretriz", "nuDiretriz", "co_diretriz", "nu_diretriz"], f"DIR-{d_idx + 1:02d}")
        dir_desc = get_str(d, ["dsDetalheDiretriz", "descricaoDiretriz", "ds_descricao"], "")
        dir_id = f"dir-{dir_cod}"

        objetivos_brutos = d.get("objetivos", d.get("listaObjetivos", []))
        if not isinstance(objetivos_brutos, list) or len(objetivos_brutos) == 0:
            objetivos_brutos = [d]

        objetivos_finais: List[Objetivo] = []

        for o_idx, o in enumerate(objetivos_brutos):
            obj_desc = get_str(o, ["dsObjetivo", "noObjetivo", "ds_objetivo", "no_objetivo", "descricao"], f"Objetivo {o_idx + 1}")
            obj_cod = get_str(o, ["coObjetivo", "nuObjetivo", "co_objetivo", "nu_objetivo"], f"OBJ-{o_idx + 1:02d}")
            obj_id = f"{dir_id}-obj-{obj_cod}"

            metas_brutas = o.get("metas", o.get("listaMetas", []))
            if not isinstance(metas_brutas, list) or len(metas_brutas) == 0:
                metas_brutas = [o]

            metas_finais: List[Meta] = []

            for m_idx, m in enumerate(metas_brutas):
                meta_desc = get_str(m, ["dsMeta", "noMeta", "ds_meta", "no_meta", "descricao"], f"Meta {m_idx + 1}")
                meta_cod = get_str(m, ["coMeta", "nuMeta", "co_meta", "nu_meta"], f"M-{m_idx + 1}")
                meta_id = f"{obj_id}-meta-{meta_cod}"

                vl_proj_plano = get_float(m, ["vlProjetadoPlano", "vl_projetado_plano"])
                vl_proj_pas = get_float(m, ["vlProjetadoPas", "vl_projetado_pas"])
                vl_exec_relatorio = get_float(m, ["vlExecutadoRelatorio", "vl_executado_relatorio"])
                vl_alcancado = get_float(m, ["vlAlcancado", "vl_alcancado", "resultado"])

                vl_proj_ref = vl_proj_pas if vl_proj_pas > 0 else (vl_proj_plano if vl_proj_plano > 0 else get_float(m, ["vlProjetado", "vl_projetado", "vlMeta"]))
                vl_fin_aplicado = vl_exec_relatorio if vl_exec_relatorio > 0 else orcamento_map.get(meta_cod, orcamento_map.get(obj_cod, 0.0))

                perc = get_float(m, ["nuPercentualAlcancado", "pcAlcance", "percentual_alcance", "percentual"])
                if perc == 0.0 and vl_proj_ref > 0:
                    perc = round((vl_alcancado / vl_proj_ref) * 100, 2)

                status_raw = get_str(m, ["dsSituacaoMeta", "status", "situacao", "ds_situacao_meta"]).lower()
                if "ating" in status_raw and "não" not in status_raw and "parcial" not in status_raw:
                    status = "atingida"
                elif "parcial" in status_raw:
                    status = "parcial"
                elif "não" in status_raw or "nao" in status_raw:
                    status = "nao_atingida"
                elif perc >= 90:
                    status = "atingida"
                elif perc >= 50:
                    status = "parcial"
                else:
                    status = "nao_atingida"

                # 1. MAPEAMENTO DE SUBFUNÇÕES (diretrizes.objetivos.metas.subfuncoes)
                subfuncoes_raw = m.get("subfuncoes", m.get("listaSubfuncoes", []))
                subfuncoes_lista: List[Subfuncao] = []
                if isinstance(subfuncoes_raw, list):
                    for sf in subfuncoes_raw:
                        no_sf = get_str(sf, ["noSubfuncao", "no_subfuncao", "dsSubfuncao", "ds_subfuncao", "nome"])
                        cod_sf = get_str(sf, ["nuCodigoInterno", "nu_codigo_interno", "coSubfuncao", "co_subfuncao", "codigo"])
                        if no_sf:
                            subfuncoes_lista.append(Subfuncao(nu_codigo_interno=cod_sf, no_subfuncao=no_sf))

                # 2. MAPEAMENTO DE INICIATIVAS (diretrizes.objetivos.metas.iniciativas)
                iniciativas_raw = m.get("iniciativas", m.get("listaIniciativas", m.get("acoes", [])))
                iniciativas_lista: List[Iniciativa] = []

                if isinstance(iniciativas_raw, list) and len(iniciativas_raw) > 0:
                    for i_idx, inic in enumerate(iniciativas_raw):
                        # ds_iniciativa é o campo oficial do RAG
                        desc_inic = get_str(inic, [
                            "dsIniciativa", "ds_iniciativa", "noIniciativa", "no_iniciativa",
                            "dsAcao", "ds_acao", "descricao", "nome"
                        ], f"Iniciativa {i_idx + 1}")

                        cod_inic = get_str(inic, ["coIniciativa", "co_iniciativa", "nuCodigoInterno", "nu_codigo_interno"], f"INIC-{i_idx + 1}")
                        vl_inic = get_float(inic, ["vlOrcamento", "vl_orcamento", "vlExecutado", "vl_executado", "valor", "vlFinanceiro"])
                        status_inic = get_str(inic, ["dsSituacao", "ds_situacao", "status"], "em_execucao")

                        iniciativas_lista.append(Iniciativa(
                            id=f"{meta_id}-inic-{i_idx + 1}",
                            codigo=cod_inic,
                            descricao=desc_inic,
                            vl_orcamento=vl_inic,
                            status=status_inic
                        ))
                elif vl_fin_aplicado > 0:
                    iniciativas_lista.append(Iniciativa(
                        id=f"{meta_id}-inic-1",
                        descricao="Execução Financeira Declarada no Relatório Anual de Gestão (RAG)",
                        vl_orcamento=vl_fin_aplicado,
                        status="concluida" if status == "atingida" else "em_execucao"
                    ))

                metas_finais.append(Meta(
                    id=meta_id,
                    codigo=meta_cod,
                    descricao=meta_desc,
                    vl_projetado_plano=vl_proj_plano,
                    vl_projetado_pas=vl_proj_pas,
                    vl_projetado=vl_proj_ref,
                    vl_alcancado=vl_alcancado,
                    vl_executado_relatorio=vl_exec_relatorio,
                    vl_financeiro_aplicado=vl_fin_aplicado,
                    percentual_alcance=perc,
                    status=status,
                    justificativa=get_str(m, ["dsJustificativa", "justificativa"]),
                    subfuncoes=subfuncoes_lista,
                    iniciativas=iniciativas_lista,
                    acoes=iniciativas_lista
                ))

            if metas_finais:
                objetivos_finais.append(Objetivo(
                    id=obj_id,
                    codigo=obj_cod,
                    descricao=obj_desc,
                    metas=metas_finais
                ))

        if objetivos_finais:
            diretrizes_finais.append(Diretriz(
                id=dir_id,
                codigo=dir_cod,
                nome=dir_nome,
                descricao=dir_desc,
                objetivos=objetivos_finais
            ))

    return diretrizes_finais

async def consultar_digisus_real(ibge_6: str, uf: str, ano: int) -> RagDashboardData:
    cache_key = f"{ibge_6}_{ano}"
    agora = time.time()

    if cache_key in CACHE_MEMORIA:
        timestamp, dados_cacheados = CACHE_MEMORIA[cache_key]
        if agora - timestamp < CACHE_TTL_SEGUNDOS:
            print(f"⚡ [CACHE HIT] Retornando dados em memória para {ibge_6} ({ano})")
            return dados_cacheados

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://digisusgmp.saude.gov.br",
        "Referer": "https://digisusgmp.saude.gov.br/",
    }

    url_rag = f"{DIGISUS_BASE}/relatorio/resultados-metas?co_esfera=1&sg_uf={uf}&co_municipio_ibge={ibge_6}&nu_ano_exercicio={ano}&co_projeto_tipo=13"
    url_pas_metas = f"{DIGISUS_BASE}/pas/dados-metas?co_esfera=1&nu_ano_exercicio={ano}&sg_uf={uf}&co_municipio_ibge={ibge_6}"
    url_pas_orcamento = f"{DIGISUS_BASE}/pas/dados-orcamentarios?co_esfera=1&nu_ano_exercicio={ano}&sg_uf={uf}&co_municipio_ibge={ibge_6}"

    print("\n" + "="*70)
    print(f"⏳ [AGUARDANDO AS 3 REQUISIÇÕES] DigiSUS IBGE {ibge_6} ({ano})")
    print("="*70)

    timeout_config = httpx.Timeout(90.0, connect=20.0)

    async with httpx.AsyncClient(timeout=timeout_config, verify=False, headers=headers) as client:
        resultados = await asyncio.gather(
            _requisitar_endpoint(client, "RAG (Resultados)", url_rag),
            _requisitar_endpoint(client, "PAS (Metas)", url_pas_metas),
            _requisitar_endpoint(client, "PAS (Orçamento)", url_pas_orcamento),
            return_exceptions=False
        )

    print("\n✅ [TODAS AS 3 REQUISIÇÕES FINALIZADAS] Consolidando hierarquia, iniciativas e subfunções...")

    dados_dict: Dict[str, Any] = {}
    diagnosticos: List[DiagnosticoChamada] = []

    for servico, url, status, t_duracao, tamanho, dados, detalhe in resultados:
        diagnosticos.append(DiagnosticoChamada(
            servico=servico,
            url=url,
            status_code=status,
            sucesso=(status == 200 and dados is not None),
            tempo_ms=t_duracao,
            tamanho_bytes=tamanho,
            detalhes=detalhe
        ))
        dados_dict[servico] = dados

    dados_rag = dados_dict.get("RAG (Resultados)")
    dados_pas_metas = dados_dict.get("PAS (Metas)")
    dados_pas_orcamento = dados_dict.get("PAS (Orçamento)")

    base_primaria = dados_rag if dados_rag else dados_pas_metas
    diretrizes_finais = processar_hierarquia_rag(base_primaria, dados_pas_orcamento)

    total_metas = sum(len(o.metas) for d in diretrizes_finais for o in d.objetivos)
    print(f"📊 [CONSOLIDAÇÃO CONCLUÍDA] {len(diretrizes_finais)} Diretrizes e {total_metas} Metas cruzadas.")

    # Extrai o nome oficial do município retornado pelo DigiSUS
    nome_oficial = None
    if isinstance(dados_rag, dict):
        nome_oficial = dados_rag.get("municipio")
    if not nome_oficial and isinstance(dados_pas_metas, dict):
        nome_oficial = dados_pas_metas.get("municipio")

    if nome_oficial:
        nome_municipio = str(nome_oficial).title()
    else:
        nome_municipio = NOMES_MUNICIPIOS_CONHECIDOS.get(ibge_6, f"Município ({ibge_6})")


    resultado_final = RagDashboardData(
        municipio_ibge=ibge_6,
        municipio_nome=nome_municipio,
        uf=uf,
        ano_exercicio=ano,
        data_fonte="DigiSUS Oficial (RAG e PAS Consolidados)",
        total_registros_brutos=total_metas,
        diagnostico_requisicoes=diagnosticos,
        diretrizes=diretrizes_finais
    )

    CACHE_MEMORIA[cache_key] = (agora, resultado_final)
    return resultado_final
