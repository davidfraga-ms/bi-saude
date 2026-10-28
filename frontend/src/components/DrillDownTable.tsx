import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Diretriz, Objetivo, Meta } from '../types';
import { ChevronDown, ChevronRight, Layers, Target, CheckCircle, AlertTriangle, XCircle, Search, DollarSign, Tag, CheckCheck } from 'lucide-react';

export const DrillDownTable: React.FC = () => {
  const { getFilteredData, searchTerm, setSearchTerm } = useStore();
  const data = getFilteredData();
  const [expandedDiretrizes, setExpandedDiretrizes] = useState<Record<string, boolean>>({});
  const [expandedObjetivos, setExpandedObjetivos] = useState<Record<string, boolean>>({});
  const [expandedMetas, setExpandedMetas] = useState<Record<string, boolean>>({});

  const toggleDiretriz = (id: string) => {
    setExpandedDiretrizes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleObjetivo = (id: string) => {
    setExpandedObjetivos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMeta = (id: string) => {
    setExpandedMetas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!data) return null;

  const filteredDiretrizes = data.diretrizes.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchDir = d.nome.toLowerCase().includes(term) || d.descricao.toLowerCase().includes(term);
    const matchObj = d.objetivos.some(o => 
      o.descricao.toLowerCase().includes(term) || 
      o.metas.some(m => 
        m.descricao.toLowerCase().includes(term) ||
        m.iniciativas.some(i => i.descricao.toLowerCase().includes(term)) ||
        m.subfuncoes.some(sf => sf.no_subfuncao.toLowerCase().includes(term))
      )
    );
    return matchDir || matchObj;
  });

  const getStatusBadge = (status: Meta['status']) => {
    switch (status) {
      case 'atingida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Atingida
          </span>
        );
      case 'parcial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Parcial
          </span>
        );
      case 'nao_atingida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" /> Não Atingida
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Topo com Busca */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Detalhamento Hierárquico do Planejamento (RAG & PAS)</h3>
          <p className="text-xs text-slate-500">
            Diretrizes $\rightarrow$ Objetivos $\rightarrow$ Metas (com Subfunções) $\rightarrow$ Iniciativas Reais (ds_iniciativa)
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por diretriz, meta, subfunção ou iniciativa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Árvore Expansível */}
      <div className="divide-y divide-slate-200">
        {filteredDiretrizes.map((dir: Diretriz) => {
          const isDirExpanded = expandedDiretrizes[dir.id] ?? true;

          return (
            <div key={dir.id} className="transition-colors">
              {/* Nível 1: Diretriz */}
              <div
                onClick={() => toggleDiretriz(dir.id)}
                className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-500 hover:text-slate-800">
                    {isDirExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="p-1.5 bg-sky-100 text-sky-700 rounded-md">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider mr-2">{dir.codigo}</span>
                    <span className="font-semibold text-slate-800 text-sm">{dir.nome}</span>
                    {dir.descricao && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{dir.descricao}</p>}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                  {dir.objetivos.length} {dir.objetivos.length === 1 ? 'Objetivo' : 'Objetivos'}
                </div>
              </div>

              {/* Nível 2: Objetivos */}
              {isDirExpanded && (
                <div className="bg-white pl-8 pr-4 py-2 divide-y divide-slate-100">
                  {dir.objetivos.map((obj: Objetivo) => {
                    const isObjExpanded = expandedObjetivos[obj.id] ?? true;

                    return (
                      <div key={obj.id} className="py-3">
                        <div
                          onClick={() => toggleObjetivo(obj.id)}
                          className="flex items-center justify-between cursor-pointer py-1.5 px-2 rounded-md hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2.5">
                            <button className="text-slate-400">
                              {isObjExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <Target className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-slate-700">{obj.descricao}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {obj.metas.length} {obj.metas.length === 1 ? 'Meta' : 'Metas'}
                          </span>
                        </div>

                        {/* Nível 3: Metas com Subfunções e Iniciativas */}
                        {isObjExpanded && (
                          <div className="mt-2 ml-6 space-y-3">
                            {obj.metas.map((meta: Meta) => {
                              const isMetaExpanded = expandedMetas[meta.id] ?? false;
                              const totalIniciativas = meta.iniciativas.length;

                              return (
                                <div key={meta.id} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                        {getStatusBadge(meta.status)}
                                        {meta.codigo && (
                                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                            {meta.codigo}
                                          </span>
                                        )}

                                        {/* Subfunções de Saúde (Ex: 304 - Vigilância Sanitária) */}
                                        {meta.subfuncoes.map((sf, sfIdx) => (
                                          <span
                                            key={sfIdx}
                                            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                                            title="Subfunção Orçamentária"
                                          >
                                            <Tag className="w-3 h-3 text-purple-500" />
                                            {sf.nu_codigo_interno ? `${sf.nu_codigo_interno} - ` : ''}{sf.no_subfuncao}
                                          </span>
                                        ))}
                                      </div>

                                      <p className="text-xs font-medium text-slate-800 leading-relaxed">{meta.descricao}</p>
                                    </div>

                                    {/* Métricas: Projetado Plano, PAS, Alcançado e Executado */}
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-slate-600 flex-shrink-0 bg-white p-2.5 rounded-lg border border-slate-200">
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Proj. Plano</span>
                                        <span className="font-semibold text-slate-700">{meta.vl_projetado_plano || '-'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Proj. PAS</span>
                                        <span className="font-semibold text-slate-700">{meta.vl_projetado_pas || meta.vl_projetado || '-'}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Alcançado</span>
                                        <span className="font-bold text-slate-900">{meta.vl_alcancado}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-medium">% Alcance</span>
                                        <span className={`font-bold ${meta.percentual_alcance >= 90 ? 'text-emerald-600' : meta.percentual_alcance >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                          {meta.percentual_alcance}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Executado Relat.</span>
                                        <span className="font-semibold text-emerald-700">
                                          R$ {(meta.vl_executado_relatorio || meta.vl_financeiro_aplicado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => toggleMeta(meta.id)}
                                      className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 self-start xl:self-center bg-sky-50 px-2.5 py-1.5 rounded-md border border-sky-200"
                                    >
                                      {isMetaExpanded ? 'Ocultar Iniciativas' : `Iniciativas (${totalIniciativas})`}
                                    </button>
                                  </div>

                                  {/* Barra de Progresso Físico */}
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full ${meta.percentual_alcance >= 90 ? 'bg-emerald-500' : meta.percentual_alcance >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${Math.min(meta.percentual_alcance, 100)}%` }}
                                    />
                                  </div>

                                  {/* Listagem Real de Iniciativas (ds_iniciativa) */}
                                  {isMetaExpanded && totalIniciativas > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                      <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
                                        Iniciativas Declaradas no RAG / Ações Vinculadas
                                      </h5>
                                      <div className="space-y-2">
                                        {meta.iniciativas.map((inic) => (
                                          <div
                                            key={inic.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs shadow-2xs"
                                          >
                                            <div className="flex items-start gap-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                                              <div>
                                                {inic.codigo && (
                                                  <span className="font-mono text-[10px] text-slate-400 mr-1.5 font-bold">
                                                    [{inic.codigo}]
                                                  </span>
                                                )}
                                                <span className="text-slate-700 font-medium leading-relaxed">
                                                  {inic.descricao}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                              {inic.vl_orcamento > 0 && (
                                                <span className="text-slate-600 font-mono flex items-center font-semibold">
                                                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                                  {inic.vl_orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                              )}
                                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                                                {inic.status}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
