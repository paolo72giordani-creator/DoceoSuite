import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import Header from '../../../shared/components/Header';
import TimelineView from './TimelineView';

export default function TimelineDashboard({ currentUser, onLogout, onNavigateBack }) {
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Stato per la creazione
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Stato per la modifica/rinomina
  const [editingTimeline, setEditingTimeline] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchTimelines = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        const { data: fallbackData } = await supabase
          .from('timelines')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        setTimelines(fallbackData || []);
      } else {
        setTimelines(data || []);
      }
    } catch (err) {
      console.error('Errore caricamento timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimelines();
  }, [currentUser]);

  // Gestione Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedTimelines = [...timelines];
    const [movedTimeline] = updatedTimelines.splice(draggedIndex, 1);
    updatedTimelines.splice(targetIndex, 0, movedTimeline);

    setTimelines(updatedTimelines);
    setDraggedIndex(null);

    try {
      const updates = updatedTimelines.map((timeline, idx) =>
        supabase
          .from('timelines')
          .update({ position: idx })
          .eq('id', timeline.id)
          .eq('user_id', currentUser.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Errore salvataggio posizione timeline:', err.message);
    }
  };

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
            user_id: currentUser.id,
            position: timelines.length
          }
        ])
        .select();

      if (error) throw error;

      setTimelines([data[0], ...timelines]);
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
      setActiveTimeline(data[0]);
    } catch (err) {
      alert('Errore creazione timeline: ' + err.message);
    }
  };

  // Apertura modale di modifica
  const handleOpenEdit = (e, timeline) => {
    e.stopPropagation();
    setEditingTimeline(timeline);
    setEditTitle(timeline.title);
    setEditDescription(timeline.description || '');
  };

  // Salvataggio Modifica / Rinomina
  const handleUpdateTimeline = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingTimeline) return;

    try {
      const { error } = await supabase
        .from('timelines')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim()
        })
        .eq('id', editingTimeline.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setTimelines((prev) =>
        prev.map((t) =>
          t.id === editingTimeline.id
            ? { ...t, title: editTitle.trim(), description: editDescription.trim() }
            : t
        )
      );

      setEditingTimeline(null);
    } catch (err) {
      alert('Errore durante la modifica della timeline: ' + err.message);
    }
  };

  // ELIMINAZIONE PULITA TIMELINE + TUTTI I FILE DEGLI EVENTI COLLEGATI
  const handleDeleteTimeline = async (e, timelineId, timelineTitle) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare la linea del tempo "${timelineTitle}"? Verranno eliminati anche tutti gli eventi e i file allegati. L'azione è irreversibile.`
    );

    if (!confirmDelete) return;

    try {
      // 1. Recupera tutti gli eventi associati alla timeline da eliminare
      const { data: events, error: eventsError } = await supabase
        .from('timeline_events')
        .select('media_url, attachment_url')
        .eq('timeline_id', timelineId);

      if (eventsError) console.error('Errore recupero eventi per pulizia file:', eventsError.message);

      // 2. Raccogli i path di tutti i file fisici da eliminare dal bucket 'card-attachments'
      if (events && events.length > 0) {
        const pathsToRemove = [];

        events.forEach((evt) => {
          if (evt.media_url) {
            const parts = evt.media_url.split('/card-attachments/');
            if (parts.length > 1) pathsToRemove.push(decodeURIComponent(parts[1]));
          }
          if (evt.attachment_url) {
            const parts = evt.attachment_url.split('/card-attachments/');
            if (parts.length > 1) pathsToRemove.push(decodeURIComponent(parts[1]));
          }
        });

        if (pathsToRemove.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('card-attachments')
            .remove(pathsToRemove);

          if (storageError) {
            console.error('Errore pulizia Storage per timeline:', storageError.message);
          }
        }
      }

      // 3. Elimina la timeline dal Database (gli eventi verranno eliminati in automatico se attiva la chiave esterna CASCADE)
      const { error } = await supabase
        .from('timelines')
        .delete()
        .eq('id', timelineId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setTimelines((prev) => prev.filter((item) => item.id !== timelineId));
    } catch (err) {
      alert('Errore durante l\'eliminazione della timeline: ' + err.message);
    }
  };

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
        <Header
          currentUser={currentUser}
          onLogout={onLogout}
          onNavigateHome={onNavigateBack}
        />

        <div className="flex justify-between items-center my-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">⏳ Doceo Timeline</h1>
            <p className="text-xs text-slate-500">Crea e proietta linee del tempo interattive per la classe.</p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer"
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
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Crea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE MODIFICA / RINOMINA TIMELINE */}
        {editingTimeline && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-4">Modifica Linea del Tempo</h2>
              <form onSubmit={handleUpdateTimeline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titolo</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTimeline(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTA TIMELINES CON DRAG & DROP */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">Caricamento in corso...</div>
        ) : timelines.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center my-8">
            <div className="text-4xl mb-2">⏳</div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Nessuna linea del tempo trovata</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Crea la tua prima timeline personale per organizzare lezioni, eventi o percorsi didattici.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              + Crea prima Timeline
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timelines.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => setActiveTimeline(item)}
                className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                      Timeline
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(e, item)}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition text-xs cursor-pointer"
                        title="Rinomina / Modifica Timeline"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTimeline(e, item.id, item.title)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition text-xs cursor-pointer"
                        title="Elimina Timeline"
                      >
                        🗑️
                      </button>
                    </div>
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