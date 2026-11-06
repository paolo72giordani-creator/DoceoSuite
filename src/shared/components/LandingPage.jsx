import React from 'react';

export default function LandingPage({ onGoToLogin, onGoToRegister }) {
  const apps = [
    {
      id: 'dilemma',
      name: 'Doceo Dilemma',
      badge: 'Debate & Scelte',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: '🔀',
      tagline: 'Storie interattive a bivi per lo sviluppo del pensiero critico',
      desc: 'Progetta scenari decisionali complessi. Gli studenti analizzano conseguenze a catena, discutono dilemmi etici o storici e confrontano percorsi alternativi sulla LIM.',
      features: [
        'Proiezione LIM con modalità presentazione immersiva',
        'Debriefing automatico con domande per il debate',
        'Galleria Community per condividere e duplicare scenari',
        'Template interdisciplinari pronti all\'uso'
      ]
    },
    {
      id: 'kanban',
      name: 'Doceo Kanban',
      badge: 'Project Work',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: '📋',
      tagline: 'Gestione visuale delle attività e compiti di realtà',
      desc: 'Organizza il lavoro cooperativo dei gruppi con colonne flessibili, stati di avanzamento, etichette e scadenze chiare.',
      features: [
        'Board collaborative per gruppi di lavoro',
        'Monitoraggio visuale dei progressi in classe',
        'Assegnazione compiti e checklist operative'
      ]
    }
  ];

  const pillars = [
    {
      icon: '🎯',
      title: 'Didattica Attiva',
      desc: 'Strumenti pensati per rendere lo studente protagonista del processo di apprendimento, non semplice spettatore.'
    },
    {
      icon: '🖥️',
      title: 'Pronto per la LIM',
      desc: 'Interfacce ad alto contrasto e tipografia ottimizzata per la visualizzazione d\'impatto sulle lavagne interattive.'
    },
    {
      icon: '🤝',
      title: 'Collaborazione tra Docenti',
      desc: 'Libreria aperta per condividere modelli didattici, adattare percorsi altrui e risparmiare tempo prezioso.'
    },
    {
      icon: '🔒',
      title: 'Sicuro & GDPR-Ready',
      desc: 'Dati protetti tramite Row Level Security (RLS) su Supabase, accessi individuali e separazione degli spazi.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-sm">
              DS
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight">Doceo Suite</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                Didattica Digitale
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              Accedi
            </button>
            <button
              onClick={onGoToRegister}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition cursor-pointer"
            >
              Registrati gratis
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
            <span>✨</span>
            <span>Ecosistema di Applicazioni per Docenti Innovatori</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Potenzia le tue lezioni con <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">esperienze interattive</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Dalla gestione dei compiti di realtà con <strong>Doceo Kanban</strong> alla creazione di scenari di dibattito ramificati con <strong>Doceo Dilemma</strong>. Tutto in un unico hub docenti.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGoToRegister}
              className="w-full sm:w-auto px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>Inizia Subito Gratuitamente</span>
            </button>
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl border border-slate-300 transition cursor-pointer"
            >
              Hai già un account? Accedi →
            </button>
          </div>
        </div>
      </section>

      {/* APPLICAZIONI IN VETRINA */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-xl mx-auto mb-14 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Gli Strumenti della Suite</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Applicazioni focalizzate su singole metodologie didattiche, senza distrazioni.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl shadow-inner">
                    {app.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${app.badgeColor}`}>
                    {app.badge}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1">{app.name}</h3>
                <p className="text-xs font-bold text-purple-700 mb-3">{app.tagline}</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{app.desc}</p>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Caratteristiche Chiave:
                  </span>
                  {app.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <span className="text-purple-600">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={onGoToLogin}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Esplora {app.name}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILASTRI PEDAGOGICI */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Perché Scegliere Doceo Suite</h2>
            <p className="text-xs text-slate-500">
              Progettata da docenti, per docenti. Senza complessità inutili.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="text-sm font-black text-slate-900 mb-1.5">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-700">Doceo Suite — Ecosistema Digitale per la Scuola</p>
        <p className="text-[11px] text-slate-400">
          Sviluppato per supportare metodologie didattiche attive, cooperative learning e debate in classe.
        </p>
      </footer>
    </div>
  );
}