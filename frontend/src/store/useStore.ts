import { create } from 'zustand';
import { RagDashboardData, Diretriz, Objetivo, Meta, AnaliseDafResponse } from '../types';

interface DashboardState {
  currentIbge: string;
  inputIbge: string;
  inputError: string | null;
  selectedYear: number;
  data: RagDashboardData | null;
  selectedSubfuncao: string | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;

  // Estados da Análise OpenAI DAF
  isAnalyzingDaf: boolean;
  dafError: string | null;
  dafResultados: AnaliseDafResponse | null;
  filtroDafAtivo: boolean;
  filtroDafApenasFortes: boolean;
  isDafModalOpen: boolean;

  // Actions
  setInputIbge: (val: string) => void;
  setSelectedYear: (ano: number) => void;
  setSelectedSubfuncao: (subfuncao: string | null) => void;
  setSearchTerm: (term: string) => void;
  consultarIbge: (ibgeCustom?: string) => Promise<void>;
  
  // Actions DAF
  setIsDafModalOpen: (open: boolean) => void;
  setFiltroDafAtivo: (ativo: boolean) => void;
  setFiltroDafApenasFortes: (apenasFortes: boolean) => void;
  analisarDaf: (apenasFortes?: boolean) => Promise<void>;

  getFilteredData: () => RagDashboardData | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Controladores de abort para evitar condição de corrida entre municípios
let activeConsultarController: AbortController | null = null;
let activeDafController: AbortController | null = null;

export const useStore = create<DashboardState>((set, get) => ({
  currentIbge: '',
  inputIbge: '',
  inputError: null,
  selectedYear: 2025,
  data: null,
  selectedSubfuncao: null,
  isLoading: false,
  error: null,
  searchTerm: '',

  // Estado inicial DAF
  isAnalyzingDaf: false,
  dafError: null,
  dafResultados: null,
  filtroDafAtivo: false,
  filtroDafApenasFortes: false,
  isDafModalOpen: false,

  setInputIbge: (val: string) => {
    const apenasNumeros = val.replace(/\D/g, '');
    let inputError: string | null = null;

    if (val !== apenasNumeros) {
      inputError = 'Digite apenas números no código IBGE.';
    } else if (apenasNumeros.length > 7) {
      inputError = 'O código IBGE não pode ter mais de 7 dígitos.';
    }

    set({ inputIbge: apenasNumeros.slice(0, 7), inputError });
  },

  setSelectedYear: (ano: number) => {
    set({
      selectedYear: ano,
      data: null,
      dafResultados: null,
      filtroDafAtivo: false,
      selectedSubfuncao: null
    });
    if (get().currentIbge) {
      get().consultarIbge();
    }
  },

  setSelectedSubfuncao: (subfuncao: string | null) => {
    set({ selectedSubfuncao: subfuncao });
  },

  setSearchTerm: (term: string) => set({ searchTerm: term }),

  setIsDafModalOpen: (open: boolean) => set({ isDafModalOpen: open }),

  setFiltroDafAtivo: (ativo: boolean) => set({ filtroDafAtivo: ativo }),

  setFiltroDafApenasFortes: (apenasFortes: boolean) => {
    set({ filtroDafApenasFortes: apenasFortes });
    if (get().dafResultados) {
      get().analisarDaf(apenasFortes);
    }
  },

  consultarIbge: async (ibgeCustom?: string) => {
    const rawIbge = ibgeCustom !== undefined ? ibgeCustom : get().inputIbge;
    const apenasNumeros = rawIbge.trim().replace(/\D/g, '');

    if (apenasNumeros.length !== 6 && apenasNumeros.length !== 7) {
      set({
        inputError: `Código inválido (${apenasNumeros.length} dígitos). O IBGE deve conter 6 ou 7 dígitos.`
      });
      return;
    }

    const ibgeProcessado = apenasNumeros.length === 7 ? apenasNumeros.slice(0, 6) : apenasNumeros;

    // Cancela requisições anteriores ativas para evitar sobreposição de resultados
    if (activeConsultarController) {
      activeConsultarController.abort();
    }
    if (activeDafController) {
      activeDafController.abort();
    }

    // Limpa totalmente os dados do município anterior
    set({
      isLoading: true,
      data: null, // Limpeza imediata dos dados anteriores
      error: null,
      inputError: null,
      currentIbge: ibgeProcessado,
      inputIbge: ibgeProcessado,
      selectedSubfuncao: null,
      searchTerm: '', // Limpa termo de busca anterior
      isAnalyzingDaf: false,
      dafError: null,
      dafResultados: null, // Limpa análise DAF anterior
      filtroDafAtivo: false,
      filtroDafApenasFortes: false,
      isDafModalOpen: false
    });

    const ano = get().selectedYear;
    activeConsultarController = new AbortController();
    const timeoutId = setTimeout(() => activeConsultarController?.abort(), 90000);

    try {
      const res = await fetch(`${API_BASE}/rag/${ibgeProcessado}?ano=${ano}`, {
        signal: activeConsultarController.signal
      });
      clearTimeout(timeoutId);

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.detail || `Erro HTTP ${res.status}`);
      }

      // Garante que a resposta pertence ao IBGE atual ativo
      if (get().currentIbge === ibgeProcessado) {
        set({ data: body, isLoading: false });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        // Requisição cancelada por uma nova busca; ignora
        return;
      }
      const msg = err.message || 'Falha ao consultar API do DigiSUS';
      set({ error: msg, isLoading: false, data: null });
    }
  },

  analisarDaf: async (apenasFortesCustom?: boolean) => {
    const { currentIbge, selectedYear, filtroDafApenasFortes } = get();
    const apenasFortes = apenasFortesCustom !== undefined ? apenasFortesCustom : filtroDafApenasFortes;

    if (activeDafController) {
      activeDafController.abort();
    }

    activeDafController = new AbortController();
    set({ isAnalyzingDaf: true, dafError: null });

    try {
      const res = await fetch(`${API_BASE}/rag/${currentIbge}/analise-daf?ano=${selectedYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: activeDafController.signal,
        body: JSON.stringify({
          apenas_fortes: apenasFortes,
          model: 'gpt-4o-mini',
          temperature: 0.1
        })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.detail || 'Erro ao processar análise do DAF com OpenAI');
      }

      // Verifica se o usuário não mudou de município enquanto a IA processava
      if (get().currentIbge === currentIbge) {
        set({
          dafResultados: body,
          filtroDafAtivo: true,
          isAnalyzingDaf: false,
          isDafModalOpen: true
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      set({
        dafError: err.message || 'Erro inesperado na análise de IA',
        isAnalyzingDaf: false
      });
    }
  },

  getFilteredData: () => {
    const { data, dafResultados, filtroDafAtivo, selectedSubfuncao } = get();

    let baseData = (filtroDafAtivo && dafResultados?.dados_filtrados) 
      ? dafResultados.dados_filtrados 
      : data;

    if (!baseData) return null;
    if (!selectedSubfuncao) return baseData;

    const diretrizesFiltradas: Diretriz[] = [];

    baseData.diretrizes.forEach((d) => {
      const objetivosFiltrados: Objetivo[] = [];

      d.objetivos.forEach((o) => {
        const metasFiltradas = o.metas.filter((m) =>
          m.subfuncoes.some((sf) => {
            const chave = sf.nu_codigo_interno || sf.no_subfuncao;
            return chave === selectedSubfuncao || sf.no_subfuncao === selectedSubfuncao;
          })
        );

        if (metasFiltradas.length > 0) {
          objetivosFiltrados.push({
            ...o,
            metas: metasFiltradas
          });
        }
      });

      if (objetivosFiltrados.length > 0) {
        diretrizesFiltradas.push({
          ...d,
          objetivos: objetivosFiltrados
        });
      }
    });

    return {
      ...baseData,
      diretrizes: diretrizesFiltradas
    };
  }
}));
