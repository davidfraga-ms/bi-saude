import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { DashboardLayout } from './components/DashboardLayout';
import { SubfuncoesFilter } from './components/SubFuncoesFIlter';
import { KpiCards } from './components/KpiCards';
import { ChartsView } from './components/ChartsView';
import { DrillDownTable } from './components/DrillDownTable';
import { DafAnalysisModal } from './components/DafAnalysisModal';
import { Loader2, AlertCircle, Info, Clock, CheckCircle2, Search } from 'lucide-react';

export const App: React.FC = () => {
  const { consultarIbge, isLoading, error, data } = useStore();
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isLoading) {
      setTempoDecorrido(0);
      interval = setInterval(() => {
        setTempoDecorrido((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  //useEffect(() => {
  //  consultarIbge();
  //}, []);

  return (
    <DashboardLayout>
      {/* Modal de Análise do DAF com OpenAI */}
      <DafAnalysisModal />

       {/* Estado Inicial: Aguardando seleção */}
      {!isLoading && !data && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm max-w-xl mx-auto text-center space-y-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Nenhum município selecionado
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Utilize um dos <strong>atalhos rápidos</strong> no topo (São Paulo, Rio de Janeiro, Salvador) ou digite um código IBGE (6 ou 7 dígitos) no campo de busca e clique em <strong>Consultar</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto text-center space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
            <Clock className="w-5 h-5 text-sky-700 absolute" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              Consultando APIs Oficiais do DigiSUS
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Buscando RAG e Programação Anual de Saúde (PAS) em paralelo...
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-semibold text-slate-700">
            <span>Tempo decorrido:</span>
            <span className="text-sky-600">{tempoDecorrido}s</span>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Requisições enviadas em paralelo (RAG + PAS Metas + Orçamento)
            </div>
            <p>Servidores do Ministério da Saúde costumam responder entre 15 a 45 segundos para capitais e grandes municípios.</p>
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && data && data.diretrizes.length === 0 && (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
          <Info className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-amber-900">Nenhum dado encontrado no DigiSUS para este exercício</h3>
          <p className="text-xs text-amber-700 mt-1 max-w-lg mx-auto">
            O município (IBGE: <strong>{data.municipio_ibge}</strong>) retornou vazio para o ano de <strong>{data.ano_exercicio}</strong>.
            Tente selecionar o exercício de <strong>2024</strong> ou <strong>2023</strong> no seletor de ano no topo.
          </p>
        </div>
      )}

      {!isLoading && data && data.diretrizes.length > 0 && (
        <React.Fragment key={`${data.municipio_ibge}_${data.ano_exercicio}`}>
          {/* Barra de Filtros por DAF IA e Subfunções */}
          <SubfuncoesFilter />
          {/* KPI Cards Reativos */}
          <KpiCards />
          {/* Gráficos Reativos */}
          <ChartsView />
          {/* Tabela Drill-Down Reativa */}
          <DrillDownTable />
        </React.Fragment>
      )}
    </DashboardLayout>
  );
};

export default App;
