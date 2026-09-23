import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../shared/components/Header';

export default function SuiteHub({ currentUser, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER CONDIVISO */}
        <Header currentUser={currentUser} onLogout={onLogout} />

        {/* INTRODUZIONE DASHBOARD */}
        <div className="my-8">
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            Le tue Applicazioni Didattiche
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Seleziona uno strumento per iniziare a lavorare o proiettare in classe.
          </p>
        </div>

        {/* GRIGLIA APPLICAZIONI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. DOCEO KANBAN */}
          <div
            onClick={() => navigate('/apps/kanban')}
            className="bg-white border border-slate-200 hover:border-blue-500 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group"
          >
            <div>
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4 shadow-sm group-hover:scale-105 transition-transform">
                📋
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                Doceo Kanban
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Gestione visiva delle lezioni, unità didattiche e attività con supporto LIM.
              </p>
            </div>
          </div>

          {/* 2. DOCEO TIMELINE */}
          <div
            onClick={() => navigate('/apps/timeline')}
            className="bg-white border border-slate-200 hover:border-emerald-500 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4 shadow-sm group-hover:scale-105 transition-transform">
                ⏳
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                Doceo Timeline
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Linee del tempo interattive ed evolutive per la cattedra, le lezioni e la LIM.
              </p>
            </div>
          </div>

          {/* 3. DOCEO DILEMMA (IN ARRIVO) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm opacity-60 cursor-not-allowed">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-sm">
                  🔀
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  IN ARRIVO
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">Doceo Dilemma</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Scenari a bivio per Debate, scelte etiche e pensiero critico.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}