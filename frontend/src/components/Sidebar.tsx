import React from 'react';
import { LayoutDashboard, Target, Layers, FileSpreadsheet, Activity, HelpCircle } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-sky-500 text-white rounded-lg shadow-md">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-wide">DigiSaúde BI</span>
          <span className="block text-xs text-sky-400 font-medium">BFF Analytics</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
        <a
          href="#dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sky-600 text-white shadow-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Visão Geral
        </a>
        <a
          href="#diretrizes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Layers className="w-4 h-4 text-slate-400" />
          Diretrizes & Objetivos
        </a>
        <a
          href="#metas"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Target className="w-4 h-4 text-slate-400" />
          Metas & Indicadores
        </a>
        <a
          href="#relatorios"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          Relatório RAG Oficial
        </a>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <HelpCircle className="w-4 h-4" />
          <span>Ajuda & Metodologia</span>
        </div>
        <p>Dados integrados conforme modelo do Ministério da Saúde (DigiSUS Gestor).</p>
      </div>
    </aside>
  );
};
