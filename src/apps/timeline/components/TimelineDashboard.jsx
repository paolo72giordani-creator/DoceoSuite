import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import Header from '../../../shared/components/Header';
import TimelineView from './TimelineView';

export default function TimelineDashboard({ currentUser, onLogout, onNavigateBack }) {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeline, setActiveTimeline] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Caricamento delle linee del tempo dell'utente
  const fetchTimelines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimelines(data || []);
    } catch (err) {
      console.error('Errore caricamento timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, []);

  // Creazione nuova Timeline
  const handleCreateTimeline = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('timelines')
        .insert([
          {
            title: newTitle.trim(),
            description: newDescription.trim(),
            user_id: currentUser.id
          }
        ])
        .select();

      if (error) throw error;

      setTimelines([data[0], ...timelines]);
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
      setActiveTimeline(data[0]); // Apre direttamente la timeline creata!
    } catch (err) {
      alert('Errore creazione timeline: ' + err.message);
    }
  };

  // Se è selezionata una Timeline, mostra la vista dettagliata
  if (activeTimeline) {
    return (
      <TimelineView
        activeTimeline={activeTimeline}
        currentUser={currentUser}
        onBack={() => setActiveTimeline(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <Header currentUser={currentUser} onLogout={onLogout} />

        {/* BARRA AZIONI */}
        <div className="flex justify-between items-center my-6">
          <div>
            <button
              onClick={onNavigateBack}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-1 flex items-center gap-1"
            >
              ← Torna al SuiteHub
            </button>
            <h1 className="text-2xl font-black text-slate-900">⏳ Doceo Timeline</h1>
            <p className="text-xs text-slate-500">Crea e proietta linee del tempo interattive per la classe.</p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
          >
            + Nuova Timeline
          </button>
        </div>

        {/* MODALE NUOVA TIMELINE */}
        {isCreating && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-4">Crea Linea del Tempo</h2>
              <form onSubmit={handleCreateTimeline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titolo</label>
                  <input
                    type="text"
                    required
                    placeholder="es. La Rivoluzione Francese"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione (opzionale)</label>
                  <textarea
                    rows={3}
                    placeholder="Note o contesto per gli studenti..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                  >
                    Crea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTA TIMELINES */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">Caricamento in corso...</div>
        ) : timelines.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center my-8">
            <div className="text-4xl mb-2">⏳</div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nessuna linea del tempo trovata</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Crea la tua prima timeline per organizzare eventi storici, scoperte o argomenti didattici.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
            >
              + Crea prima Timeline
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timelines.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTimeline(item)}
                className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                      Timeline
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1 group-hover:text-emerald-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.description || 'Nessuna descrizione'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                  <span>{new Date(item.created_at).toLocaleDateString('it-IT')}</span>
                  <span className="text-emerald-600 font-bold group-hover:underline">Apri →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}