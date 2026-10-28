import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const ChartsView: React.FC = () => {
  const { getFilteredData } = useStore();
  const data = getFilteredData();

  // Gráfico de Barras por Diretriz Filtrada
  const barChartData = useMemo(() => {
    if (!data) return [];
    return data.diretrizes.map((dir) => {
      let totalMetas = 0;
      let somaPerc = 0;
      let somaFin = 0;

      dir.objetivos.forEach((o) => {
        o.metas.forEach((m) => {
          totalMetas++;
          somaPerc += m.percentual_alcance;
          somaFin += (m.vl_executado_relatorio || m.vl_financeiro_aplicado || 0);
        });
      });

      return {
        name: dir.codigo,
        descricaoCurta: dir.nome.length > 25 ? dir.nome.substring(0, 25) + '...' : dir.nome,
        alcanceMedio: totalMetas > 0 ? Number((somaPerc / totalMetas).toFixed(1)) : 0,
        orcamentoTotalMil: Number((somaFin / 1000).toFixed(0)),
      };
    });
  }, [data]);

  // Gráfico de Rosca de Status das Metas Filtradas
  const donutChartData = useMemo(() => {
    if (!data) return [];
    const counts = { atingida: 0, parcial: 0, nao_atingida: 0 };

    data.diretrizes.forEach((d) => {
      d.objetivos.forEach((o) => {
        o.metas.forEach((m) => {
          counts[m.status] = (counts[m.status] || 0) + 1;
        });
      });
    });

    return [
      { name: 'Atingida (>= 90%)', value: counts.atingida, color: '#10b981' },
      { name: 'Parcial (50% a 89%)', value: counts.parcial, color: '#f59e0b' },
      { name: 'Não Atingida (< 50%)', value: counts.nao_atingida, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico de Barras */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800">Alcance Médio por Diretriz na Subfunção (%)</h3>
          <p className="text-xs text-slate-500">Média percentual das metas para a seleção ativa</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} dy={5} />
              <YAxis unit="%" tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg">
                        <p className="font-bold mb-1">{item.name} - {item.descricaoCurta}</p>
                        <p className="text-sky-300">Alcance Médio: {item.alcanceMedio}%</p>
                        <p className="text-slate-300">Executado Declarado: R$ {item.orcamentoTotalMil} mil</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="alcanceMedio" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Donut */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-800">Status das Metas Selecionadas</h3>
          <p className="text-xs text-slate-500">Distribuição física no RAG</p>
        </div>
        <div className="h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutChartData}
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {donutChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any) => [`${val} metas`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => <span className="text-xs font-medium text-slate-700">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
