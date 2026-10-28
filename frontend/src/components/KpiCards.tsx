import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Layers, Target, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { getFilteredData } = useStore();
  const data = getFilteredData();

  const metrics = useMemo(() => {
    if (!data) return { totalDiretrizes: 0, totalMetas: 0, mediaAlcance: 0, totalExecutadoRelatorio: 0, atingidas: 0, parciais: 0, naoAtingidas: 0 };

    let totalMetas = 0;
    let somaAlcance = 0;
    let totalExecutadoRelatorio = 0;
    let atingidas = 0;
    let parciais = 0;
    let naoAtingidas = 0;

    data.diretrizes.forEach((d) => {
      d.objetivos.forEach((o) => {
        o.metas.forEach((m) => {
          totalMetas++;
          somaAlcance += m.percentual_alcance;
          totalExecutadoRelatorio += (m.vl_executado_relatorio || m.vl_financeiro_aplicado || 0);

          if (m.status === 'atingida') atingidas++;
          else if (m.status === 'parcial') parciais++;
          else naoAtingidas++;
        });
      });
    });

    const mediaAlcance = totalMetas > 0 ? somaAlcance / totalMetas : 0;

    return {
      totalDiretrizes: data.diretrizes.length,
      totalMetas,
      mediaAlcance: Number(mediaAlcance.toFixed(1)),
      totalExecutadoRelatorio,
      atingidas,
      parciais,
      naoAtingidas,
    };
  }, [data]);

  const cards = [
    {
      title: 'Diretrizes Estratégicas',
      value: metrics.totalDiretrizes,
      subtext: 'Eixos vinculados ao filtro',
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      title: 'Metas Filtradas (RAG)',
      value: metrics.totalMetas,
      subtext: `${metrics.atingidas} atingidas | ${metrics.naoAtingidas} não atingidas`,
      icon: Target,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100'
    },
    {
      title: 'Média de Alcance',
      value: `${metrics.mediaAlcance}%`,
      subtext: 'Média física ponderada',
      icon: TrendingUp,
      color: metrics.mediaAlcance >= 75 ? 'text-emerald-600' : 'text-amber-600',
      bg: metrics.mediaAlcance >= 75 ? 'bg-emerald-50' : 'bg-amber-50',
      border: metrics.mediaAlcance >= 75 ? 'border-emerald-100' : 'border-amber-100'
    },
    {
      title: 'Executado no Relatório',
      value: `R$ ${(metrics.totalExecutadoRelatorio / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`,
      subtext: 'Recurso financeiro da subfunção',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{card.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
