import React from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, X, CheckCircle2, AlertTriangle, HelpCircle, Filter, Tag, Quote, ShieldCheck } from 'lucide-react';

export const DafAnalysisModal: React.FC = () => {
  const {
    isDafModalOpen,
    setIsDafModalOpen,
    dafResultados,
    isAnalyzingDaf,
    filtroDafAtivo,
    setFiltroDafAtivo,
    filtroDafApenasFortes,
    setFiltroDafApenasFortes
  } = useStore();

  if (!isDafModalOpen || !dafResultados) return null;

  const getCategoriaBadge = (cat: string) => {
    switch (cat) {
      case 'EVIDENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            EVIDENTE (&gt;90%)
          </span>
        );
      case 'PROVAVEL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <AlertTriangle className="w-3.5 h-3.5 text-sky-600" />
            PROVÁVEL (70% a 90%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            POSSÍVEL (50% a 70%)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header do Modal */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Análise Especialista: Assistência Farmacêutica (DAF)</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-900/80 text-purple-200 border border-purple-700">
                  OpenAI gpt-4o-mini
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {dafResultados.municipio_nome} - {dafResultados.uf} | Exercício {dafResultados.ano_exercicio}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDafModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Estatísticas e Controles */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Achados Identificados:</span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {dafResultados.total_evidentes} Evidentes
            </span>
            <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold">
              {dafResultados.total_provaveis} Prováveis
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              {dafResultados.total_possiveis} Possíveis
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle apenas fortes */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filtroDafApenasFortes}
                onChange={(e) => setFiltroDafApenasFortes(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <span>Apenas Relacionamento Forte (&gt;70%)</span>
            </label>

            {/* Toggle ativar filtro no painel */}
            <button
              onClick={() => setFiltroDafAtivo(!filtroDafAtivo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                filtroDafAtivo
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {filtroDafAtivo ? 'Filtro no Painel Ativo' : 'Ativar Filtro no Painel'}
            </button>
          </div>
        </div>

        {/* Lista de Achados */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {dafResultados.achados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Nenhum achado com os critérios selecionados.</p>
              <p className="text-xs text-slate-400 mt-1">Desmarque "Apenas Relacionamento Forte" para ver possíveis relações indiretas.</p>
            </div>
          ) : (
            dafResultados.achados.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-4 shadow-xs transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-purple-50 text-purple-700 rounded-md">
                      <Tag className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {item.elemento_origem}
                    </span>
                  </div>
                  {getCategoriaBadge(item.categoria)}
                </div>

                {/* Trecho extraído */}
                <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-purple-500 flex items-start gap-2.5 text-xs text-slate-700">
                  <Quote className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="italic font-medium leading-relaxed">
                    "{item.trecho_analisado}"
                  </p>
                </div>

                {/* Justificativa Técnica */}
                <div className="text-xs text-slate-600 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                  <strong className="text-purple-900 block mb-0.5 font-semibold">Justificativa Técnica:</strong>
                  <p className="leading-relaxed">{item.justificativa}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Escala DAF: POSSÍVEL (50-70%) | PROVÁVEL (70-90%) | EVIDENTE (&gt;90%)</span>
          <button
            onClick={() => setIsDafModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
