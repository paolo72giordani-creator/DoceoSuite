import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ currentUser, onLogout, onNavigateHome }) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="bg-white border border-slate-200/80 rounded-2xl px-6 py-3.5 flex justify-between items-center shadow-sm">
      {/* LOGO CLICCABILE PER TORNARE ALLA HOME */}
      <button
        type="button"
        onClick={handleLogoClick}
        className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
        title="Torna a Doceo Suite"
      >
        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm group-hover:bg-emerald-600 transition-colors shadow-sm">
          DS
        </div>
        <span className="font-black text-lg text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
          Doceo Suite
        </span>
      </button>

      {/* INFO UTENTE ED ESCI */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {currentUser?.email}
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>🚪</span> Esci
        </button>
      </div>
    </header>
  );
}