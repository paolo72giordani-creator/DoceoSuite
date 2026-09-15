import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SuiteHubProps {
  currentUser: any;
  onLogout: () => void;
}

export default function SuiteHub({ currentUser, onLogout }: SuiteHubProps) {
  const navigate = useNavigate();

  const apps = [
    {
      id: 'kanban',
      title: 'Doceo Kanban',
      description: 'Gestione visiva delle lezioni, unita didattiche e attivita con supporto LIM.',
      icon: '📋',
      color: 'bg-blue-600',
      active: true,
      route: '/apps/kanban'
    },
    {
      id: 'timeline',
      title: 'Doceo Timeline',
      description: 'Linee del tempo interattive ed evolutive per la cattedra e la LIM.',
      icon: '⏳',
      color: 'bg-emerald-600',
      active: false,
      badge: 'In Arrivo'
    },
    {
      id: 'dilemma',
      title: 'Doceo Dilemma',
      description: 'Scenari a bivio per Debate, scelte etiche e pensiero critico.',
      icon: '🔀',
      color: 'bg-purple-600',
      active: false,
      badge: 'In Arrivo'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      {/* HEADER SUITE */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white font-black text-xl rounded-xl flex items-center justify-center shadow-md">
            DS
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Doceo Suite</h1>
            <p className="text-xs font-semibold text-slate-500">Piattaforma Didattica Integrata</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">
            Insegnante: <strong className="text-slate-900">{currentUser?.email}</strong>
          </span>
          <button
            onClick={onLogout}
            className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <span>🚪</span> Esci
          </button>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900">Le tue Applicazioni Didattiche</h2>
          <p className="text-sm text-slate-600 mt-1">
            Seleziona uno strumento per iniziare a lavorare o proiettare in classe.
          </p>
        </div>

        {/* GRIGLIA PRODOTTI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              onClick={() => app.active && app.route && navigate(app.route)}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                app.active
                  ? 'border-slate-200 hover:border-blue-500 hover:shadow-xl cursor-pointer hover:-translate-y-1'
                  : 'border-slate-200 opacity-75 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 text-2xl rounded-2xl flex items-center justify-center text-white shadow-md ${app.color}`}>
                    {app.icon}
                  </div>
                  {!app.active && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full">
                      {app.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{app.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{app.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-xs font-bold ${app.active ? 'text-blue-600' : 'text-slate-400'}`}>
                  {app.active ? 'Apri applicazione →' : 'Disponibile a breve'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200 bg-white">
        Doceo Suite — Strumenti digitali pensati per la scuola
      </footer>
    </div>
  );
}