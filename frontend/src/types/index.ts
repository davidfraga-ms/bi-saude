export interface Subfuncao {
  nu_codigo_interno?: string;
  no_subfuncao: string;
}

export interface Iniciativa {
  id: string;
  codigo?: string;
  descricao: string;
  vl_orcamento: number;
  status: string;
}

export interface Meta {
  id: string;
  codigo: string;
  descricao: string;
  vl_projetado_plano: number;
  vl_projetado_pas: number;
  vl_projetado: number;
  vl_alcancado: number;
  vl_executado_relatorio: number;
  vl_financeiro_aplicado: number;
  percentual_alcance: number;
  status: 'atingida' | 'parcial' | 'nao_atingida';
  justificativa?: string;
  subfuncoes: Subfuncao[];
  iniciativas: Iniciativa[];
  acoes: Iniciativa[];
}

export interface Objetivo {
  id: string;
  codigo: string;
  descricao: string;
  metas: Meta[];
}

export interface Diretriz {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  objetivos: Objetivo[];
}

export interface DiagnosticoChamada {
  servico: string;
  url: string;
  status_code?: number;
  sucesso: boolean;
  tempo_ms: number;
  tamanho_bytes: number;
  detalhes: string;
}

export interface RagDashboardData {
  municipio_ibge: string;
  municipio_nome: string;
  uf: string;
  ano_exercicio: number;
  data_fonte: string;
  total_registros_brutos: number;
  diagnostico_requisicoes: DiagnosticoChamada[];
  diretrizes: Diretriz[];
}

// --- Tipos OpenAI Assistência Farmacêutica (DAF) ---

export type CategoriaDaf = 'POSSIVEL' | 'PROVAVEL' | 'EVIDENTE';

export interface AchadoDAF {
  elemento_origem: string;
  trecho_analisado: string;
  justificativa: string;
  categoria: CategoriaDaf;
}

export interface AnaliseDafResponse {
  municipio_ibge: string;
  municipio_nome: string;
  uf: string;
  ano_exercicio: number;
  total_achados: number;
  total_evidentes: number;
  total_provaveis: number;
  total_possiveis: number;
  apenas_fortes_aplicado: boolean;
  achados: AchadoDAF[];
  dados_filtrados?: RagDashboardData;
}
