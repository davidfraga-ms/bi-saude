import React from 'react';
import { useStore } from '../store/useStore';
import { Search, Calendar, Database, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    inputIbge,
    setInputIbge,
    inputError,
    currentIbge,
    consultarIbge,
    selectedYear,
    setSelectedYear,
    data,
    isLoading
  } = useStore();

  const presets = [
    { nome: 'São Paulo (SP)', ibge: '355030' },
    { nome: 'Rio de Janeiro (RJ)', ibge: '330455' },
    { nome: 'Salvador (BA)', ibge: '292740' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    consultarIbge();
  };

  const handlePresetClick = (ibge: string) => {
    setInputIbge(ibge);
    consultarIbge(ibge);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Título e Município Ativo */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">
              {isLoading
                ? `Consultando IBGE ${currentIbge}...`
                : data?.municipio_nome
                ? `${data.municipio_nome} - ${data.uf}`
                : 'Painel RAG & PAS'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> DigiSUS Live
            </span>
          </div>
           <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            IBGE Ativo: <strong className="text-slate-700 font-mono">{currentIbge || 'Nenhum'}</strong>
            {!isLoading && data?.total_registros_brutos !== undefined && (
              <span className="text-slate-400">({data.total_registros_brutos} registros DigiSUS)</span>
            )}
          </p>
        </div>

        {/* Atalhos Rápidos */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Atalhos:</span>
          {presets.map((p) => (
            <button
              key={p.ibge}
              onClick={() => handlePresetClick(p.ibge)}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                currentIbge === p.ibge
                  ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.nome}
            </button>
          ))}
        </div>

        {/* Formulário de Busca por IBGE e Ano */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-1 w-full sm:w-auto">
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  maxLength={7}
                  placeholder="Digitar IBGE (6 ou 7 dígitos)"
                  value={inputIbge}
                  onChange={(e) => setInputIbge(e.target.value)}
                  className={`pl-3 pr-2 py-1.5 border rounded-l-lg text-sm w-56 font-mono focus:outline-none ${
                    inputError
                      ? 'border-rose-400 focus:ring-1 focus:ring-rose-400 bg-rose-50'
                      : 'border-slate-300 focus:ring-1 focus:ring-sky-500 bg-white'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !!inputError || (inputIbge.length !== 6 && inputIbge.length !== 7)}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-r-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Consultar</span>
              </button>
            </div>
            {inputError && (
              <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {inputError}
              </span>
            )}
          </form>

          {/* Seletor de Ano */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-sm text-sm">
            <Calendar className="w-4 h-4 text-slate-500 mr-1.5" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
