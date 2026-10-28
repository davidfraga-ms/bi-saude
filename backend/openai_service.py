import os
import json
import logging
from typing import List, Tuple, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
from fastapi import HTTPException
from models import RagDashboardData, Diretriz, Objetivo, Meta, AchadoDAF, AnaliseDafResponse

load_dotenv()

logger = logging.getLogger("bi_saude")

# System Prompt oficial especificado
SYSTEM_PROMPT = """Atue como um especialista em Saúde Pública e Assistência Farmacêutica do SUS. Sua missão é analisar textos de instrumentos de planejamento público (como RAG e PAS) e identificar qualquer diretriz, objetivo, meta ou iniciativa que possua aderência ao escopo do Departamento de Assistência Farmacêutica e Insumos Estratégicos (DAF/SECTICS).

Considere o seguinte escopo central do DAF para a sua análise:
- Garantia de acesso e promoção do uso racional de medicamentos.
- Gestão e financiamento dos Componentes da Assistência Farmacêutica (Básico, Estratégico e Especializado).
- Estruturação logística, aquisição, armazenamento e distribuição de fármacos.
- Gestão de sistemas de informação farmacêutica (como e-SUS AF e Hórus).
- Manutenção da RENAME (Relação Nacional de Medicamentos Essenciais) e programas de provimento (ex: Farmácia Popular, Remédio em Casa).

Sua tarefa é extrair os trechos relevantes e categorizar o grau de relação de cada achado utilizando rigorosamente a escala abaixo:

* POSSIVEL (50% a 70%): Relação indireta. O texto menciona a aquisição de "insumos gerais de saúde", "custeio de unidades" ou "estruturação física" que pode englobar farmácias ou almoxarifados, mas sem focar explicitamente em medicamentos.
* PROVAVEL (70% a 90%): Relação direta genérica. O texto cita explicitamente a "dispensação de medicamentos", "compra de remédios para a rede", "estruturação de farmácias regionais/UBS" ou "capacitação em dispensação", sem utilizar a nomenclatura técnica dos programas federais.
* EVIDENTE (>90%): Relação direta e técnica. O texto menciona "Assistência Farmacêutica", "Uso Racional de Medicamentos", "CBAF/CEAF/CESAF", sistemas como "Hórus" ou "e-SUS AF", "RENAME", ou a reestruturação de Centrais de Abastecimento Farmacêutico (CAF).

Retorne a análise estritamente em formato JSON, utilizando a seguinte estrutura:
{
  "achados": [
    {
      "elemento_origem": "Diretriz / Objetivo / Meta / Ação (conforme identificado)",
      "trecho_analisado": "Texto original extraído",
      "justificativa": "Breve explicação técnica do motivo da categorização",
      "categoria": "POSSIVEL"
    }
  ]
}
"""

USER_PROMPT_TEMPLATE = """Analise o seguinte conteúdo JSON/Texto e aplique a categorização de similaridade com o DAF:

{texto_do_rag}
"""

def serializar_rag_para_prompt(dados: RagDashboardData) -> str:
    """
    Serializa a hierarquia do RAG em formato JSON compacto e contextualizado,
    otimizando a leitura do modelo e economizando tokens.
    """
    itens = []
    for d in dados.diretrizes:
        dir_dict: Dict[str, Any] = {
            "elemento": f"Diretriz [{d.codigo}]",
            "nome": d.nome,
            "descricao": d.descricao,
            "objetivos": []
        }
        for o in d.objetivos:
            obj_dict: Dict[str, Any] = {
                "elemento": f"Objetivo [{o.codigo}]",
                "descricao": o.descricao,
                "metas": []
            }
            for m in o.metas:
                meta_dict: Dict[str, Any] = {
                    "elemento": f"Meta [{m.codigo}]",
                    "descricao": m.descricao,
                    "subfuncoes": [sf.no_subfuncao for sf in m.subfuncoes],
                    "iniciativas": [inic.descricao for inic in m.iniciativas],
                    "justificativa": m.justificativa or ""
                }
                obj_dict["metas"].append(meta_dict)
            dir_dict["objetivos"].append(obj_dict)
        itens.append(dir_dict)

    return json.dumps(itens, ensure_ascii=False, indent=2)

async def consultar_openai_daf(
    texto_rag: str,
    model: str = "gpt-4o-mini",
    temperature: float = 0.1
) -> List[AchadoDAF]:
    """
    Chama a API da OpenAI com resposta JSON e extrai os achados.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Variável de ambiente OPENAI_API_KEY não configurada no servidor."
        )

    client = AsyncOpenAI(api_key=api_key)
    prompt_usuario = USER_PROMPT_TEMPLATE.format(texto_do_rag=texto_rag)

    try:
        logger.info(f"Disparando análise OpenAI ({model}) para Assistência Farmacêutica...")
        resposta = await client.chat.completions.create(
            model=model,
            temperature=temperature,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_usuario}
            ]
        )

        conteudo = resposta.choices[0].message.content or "{}"
        dados_json = json.loads(conteudo)

        # Trata array direto ou chave raiz "achados"
        lista_achados_raw = []
        if isinstance(dados_json, list):
            lista_achados_raw = dados_json
        elif isinstance(dados_json, dict):
            if "achados" in dados_json and isinstance(dados_json["achados"], list):
                lista_achados_raw = dados_json["achados"]
            else:
                for v in dados_json.values():
                    if isinstance(v, list):
                        lista_achados_raw = v
                        break

        achados: List[AchadoDAF] = []
        for item in lista_achados_raw:
            if isinstance(item, dict):
                cat = str(item.get("categoria", "POSSIVEL")).upper().strip()
                if cat not in ["POSSIVEL", "PROVAVEL", "EVIDENTE"]:
                    cat = "POSSIVEL"

                achados.append(AchadoDAF(
                    elemento_origem=str(item.get("elemento_origem", "Não identificado")),
                    trecho_analisado=str(item.get("trecho_analisado", "")),
                    justificativa=str(item.get("justificativa", "")),
                    categoria=cat # type: ignore
                ))

        logger.info(f"OpenAI identificou {len(achados)} achados relacionados ao DAF.")
        return achados

    except Exception as ex:
        logger.error(f"Erro ao consultar OpenAI: {str(ex)}")
        raise HTTPException(
            status_code=502,
            detail=f"Falha na comunicação com a API da OpenAI: {str(ex)}"
        )

def filtrar_rag_por_achados(
    dados: RagDashboardData,
    achados: List[AchadoDAF],
    apenas_fortes: bool = False
) -> Tuple[RagDashboardData, List[AchadoDAF]]:
    """
    Filtra os achados pelas categorias (apenas fortes: PROVAVEL e EVIDENTE)
    e constrói uma árvore do RAG contendo somente as diretrizes, objetivos e metas pertinentes.
    """
    categorias_alvo = {"PROVAVEL", "EVIDENTE"} if apenas_fortes else {"POSSIVEL", "PROVAVEL", "EVIDENTE"}
    achados_filtrados = [a for a in achados if a.categoria in categorias_alvo]

    # Lista de trechos e termos relevantes para cruzamento na árvore
    termos_relevantes = [a.trecho_analisado.lower().strip() for a in achados_filtrados if a.trecho_analisado]
    origens_relevantes = [a.elemento_origem.lower().strip() for a in achados_filtrados if a.elemento_origem]

    diretrizes_filtradas: List[Diretriz] = []

    for d in dados.diretrizes:
        objetivos_filtrados: List[Objetivo] = []

        for o in d.objetivos:
            metas_filtradas: List[Meta] = []

            for m in o.metas:
                # Verifica se a meta ou suas iniciativas/subfunções correspondem aos achados
                meta_texto = f"{m.codigo} {m.descricao} {' '.join(i.descricao for i in m.iniciativas)} {' '.join(sf.no_subfuncao for sf in m.subfuncoes)}".lower()

                match_meta = any(
                    (t in meta_texto or meta_texto in t) for t in termos_relevantes if len(t) > 5
                ) or any(
                    (m.codigo.lower() in orig and len(m.codigo) > 1) for orig in origens_relevantes
                )

                if match_meta:
                    metas_filtradas.append(m)

            if metas_filtradas:
                objetivos_filtrados.append(Objetivo(
                    id=o.id,
                    codigo=o.codigo,
                    descricao=o.descricao,
                    metas=metas_filtradas
                ))

        if objetivos_filtrados:
            diretrizes_filtradas.append(Diretriz(
                id=d.id,
                codigo=d.codigo,
                nome=d.nome,
                descricao=d.descricao,
                objetivos=objetivos_filtrados
            ))

    total_metas_filtradas = sum(len(o.metas) for d in diretrizes_filtradas for o in d.objetivos)

    dados_filtrados = RagDashboardData(
        municipio_ibge=dados.municipio_ibge,
        municipio_nome=dados.municipio_nome,
        uf=dados.uf,
        ano_exercicio=dados.ano_exercicio,
        data_fonte=f"DigiSUS Oficial - Filtrado por Assistência Farmacêutica (DAF IA)",
        total_registros_brutos=total_metas_filtradas,
        diagnostico_requisicoes=dados.diagnostico_requisicoes,
        diretrizes=diretrizes_filtradas
    )

    return dados_filtrados, achados_filtrados

async def executar_analise_daf_completa(
    dados_rag: RagDashboardData,
    apenas_fortes: bool = False,
    model: str = "gpt-4o-mini",
    temperature: float = 0.1
) -> AnaliseDafResponse:
    """
    Fluxo completo: serializa o RAG, chama OpenAI, calcula estatísticas e filtra a árvore.
    """
    texto_rag = serializar_rag_para_prompt(dados_rag)
    achados_brutos = await consultar_openai_daf(texto_rag=texto_rag, model=model, temperature=temperature)

    total_evidentes = sum(1 for a in achados_brutos if a.categoria == "EVIDENTE")
    total_provaveis = sum(1 for a in achados_brutos if a.categoria == "PROVAVEL")
    total_possiveis = sum(1 for a in achados_brutos if a.categoria == "POSSIVEL")

    dados_filtrados, achados_finais = filtrar_rag_por_achados(
        dados=dados_rag,
        achados=achados_brutos,
        apenas_fortes=apenas_fortes
    )

    return AnaliseDafResponse(
        municipio_ibge=dados_rag.municipio_ibge,
        municipio_nome=dados_rag.municipio_nome,
        uf=dados_rag.uf,
        ano_exercicio=dados_rag.ano_exercicio,
        total_achados=len(achados_brutos),
        total_evidentes=total_evidentes,
        total_provaveis=total_provaveis,
        total_possiveis=total_possiveis,
        apenas_fortes_aplicado=apenas_fortes,
        achados=achados_finais,
        dados_filtrados=dados_filtrados
    )
