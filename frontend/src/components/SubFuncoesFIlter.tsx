import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Filter, Layers, Check, Sparkles, Loader2, ShieldAlert } from 'lucide-react';

export const SubfuncoesFilter: React.FC = () => {
  const {
    data,
    selectedSubfuncao,
    setSelectedSubfuncao,
    analisarDaf,
    isAnalyzingDaf,
    dafResultados,
    filtroDafAtivo,
    setFiltroDafAtivo,
    setIsDafModalOpen,
    dafError
  } = useStore();

  // Extrai lista única de subfunções com contagem de metas vinculadas
  const subfuncoesLista = useMemo(() => {
    if (!data) return { lista: [], totalGeralMetas: 0 };

    const mapa = new Map<string, { chave: string; codigo?: string; nome: string; count: number }>();
    let totalGeralMetas = 0;

    data.diretrizes.forEach((d) => {
      d.objetivos.forEach((o) => {
        o.metas.forEach((m) => {
          totalGeralMetas++;
          if (m.subfuncoes && m.subfuncoes.length > 0) {
            m.subfuncoes.forEach((sf) => {
              const chave = sf.nu_codigo_interno || sf.no_subfuncao;
              const existente = mapa.get(chave);
              if (existente) {
                existente.count++;
              } else {
                mapa.set(chave, {
                  chave,
                  codigo: sf.nu_codigo_interno,
                  nome: sf.no_subfuncao,
                  count: 1
                });
              }
            });
          }
        });
      });
    });

    const lista = Array.from(mapa.values()).sort((a, b) => b.count - a.count);
    return { lista, totalGeralMetas };
  }, [data]);

  if (!data || data.diretrizes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Linha Superior: Filtro Especialista DAF com OpenAI */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Filtro Especialista DAF (OpenAI):
            </span>
            <p className="text-[11px] text-slate-500">
              Identifica e isola metas com relacionamento forte com a Assistência Farmacêutica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dafResultados ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDafModalOpen(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Ver Análise ({dafResultados.achados.length} achados)</span>
              </button>

              <button
                onClick={() => setFiltroDafAtivo(!filtroDafAtivo)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  filtroDafAtivo
                    ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filtroDafAtivo && <Check className="w-3.5 h-3.5" />}
                <span>{filtroDafAtivo ? 'Filtro DAF Ativo no Painel' : 'Ativar Filtro DAF'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => analisarDaf()}
              disabled={isAnalyzingDaf}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
            >
              {isAnalyzingDaf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analisando com OpenAI (gpt-4o-mini)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Filtrar por Assistência Farmacêutica (OpenAI)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {dafError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{dafError}</span>
        </div>
      )}

      {/* Linha Inferior: Filtro por Subfunções Tradicionais */}
      {subfuncoesLista.lista.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Ou filtrar por Subfunção Orçamentária:
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubfuncao(null)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                selectedSubfuncao === null
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {selectedSubfuncao === null && <Check className="w-3.5 h-3.5" />}
              <span>Todas as Subfunções</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedSubfuncao === null ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {subfuncoesLista.totalGeralMetas}
              </span>
            </button>

            {subfuncoesLista.lista.map((sf) => {
              const isAtivo = selectedSubfuncao === sf.chave || selectedSubfuncao === sf.nome;

              return (
                <button
                  key={sf.chave}
                  onClick={() => setSelectedSubfuncao(sf.chave)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    isAtivo
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isAtivo && <Check className="w-3.5 h-3.5" />}
                  <span>
                    {sf.codigo ? `${sf.codigo} - ` : ''}
                    {sf.nome}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isAtivo ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {sf.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
