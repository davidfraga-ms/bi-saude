from typing import List, Literal, Optional, Any
from pydantic import BaseModel, Field

class Subfuncao(BaseModel):
    nu_codigo_interno: Optional[str] = None
    no_subfuncao: str

class Iniciativa(BaseModel):
    id: str
    codigo: Optional[str] = None
    descricao: str  # Extraído de ds_iniciativa
    vl_orcamento: float = 0.0
    status: str = "em_execucao"

class Meta(BaseModel):
    id: str
    codigo: str = ""
    descricao: str
    # Valores do RAG
    vl_projetado_plano: float = 0.0
    vl_projetado_pas: float = 0.0
    vl_projetado: float = 0.0
    vl_alcancado: float = 0.0
    vl_executado_relatorio: float = 0.0
    vl_financeiro_aplicado: float = 0.0
    percentual_alcance: float = 0.0
    status: Literal["atingida", "parcial", "nao_atingida"] = "parcial"
    justificativa: Optional[str] = None
    # Subfunções e Iniciativas reais do RAG
    subfuncoes: List[Subfuncao] = Field(default_factory=list)
    iniciativas: List[Iniciativa] = Field(default_factory=list)
    # Mantido para retrocompatibilidade
    acoes: List[Iniciativa] = Field(default_factory=list)

class Objetivo(BaseModel):
    id: str
    codigo: str = ""
    descricao: str
    metas: List[Meta] = Field(default_factory=list)

class Diretriz(BaseModel):
    id: str
    codigo: str
    nome: str
    descricao: str = ""
    objetivos: List[Objetivo] = Field(default_factory=list)

class DiagnosticoChamada(BaseModel):
    servico: str
    url: str
    status_code: Optional[int] = None
    sucesso: bool
    tempo_ms: float
    tamanho_bytes: int = 0
    detalhes: str = ""

class RagDashboardData(BaseModel):
    municipio_ibge: str
    municipio_nome: str
    uf: str
    ano_exercicio: int
    data_fonte: str = "DigiSUS Oficial (RAG e PAS Consolidados)"
    total_registros_brutos: int = 0
    diagnostico_requisicoes: List[DiagnosticoChamada] = Field(default_factory=list)
    diretrizes: List[Diretriz] = Field(default_factory=list)

# --- Modelos de Integração OpenAI DAF ---

CategoriaDaf = Literal["POSSIVEL", "PROVAVEL", "EVIDENTE"]

class AchadoDAF(BaseModel):
    elemento_origem: str
    trecho_analisado: str
    justificativa: str
    categoria: CategoriaDaf

class AnaliseDafRequest(BaseModel):
    apenas_fortes: bool = False  # True para filtrar apenas PROVAVEL e EVIDENTE
    model: str = "gpt-4o-mini"
    temperature: float = 0.1
    texto_customizado: Optional[str] = None

class AnaliseDafResponse(BaseModel):
    municipio_ibge: str
    municipio_nome: str
    uf: str
    ano_exercicio: int
    total_achados: int
    total_evidentes: int
    total_provaveis: int
    total_possiveis: int
    apenas_fortes_aplicado: bool
    achados: List[AchadoDAF] = Field(default_factory=list)
    dados_filtrados: Optional[RagDashboardData] = None
