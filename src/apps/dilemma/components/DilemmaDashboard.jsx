import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import Header from '../../../shared/components/Header';
import { DILEMMA_TEMPLATES } from '../data/dilemmaTemplates';
import DilemmaEditor from './DilemmaEditor';
import DilemmaPresentationModal from './DilemmaPresentationModal';

export default function DilemmaDashboard({ currentUser, onLogout, onNavigateBack }) {
  const [activeTab, setActiveTab] = useState('my-dilemmas');
  const [dilemmas, setDilemmas] = useState([]);
  const [publicDilemmas, setPublicDilemmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isPresenting, setIsPresenting] = useState(false);

  // STATO PER APRIRE L'EDITOR
  const [activeDilemma, setActiveDilemma] = useState(null);

  // Modale creazione
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState('scratch');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('🔀');

  // Modale modifica dettagli dilemma
  const [editingDilemma, setEditingDilemma] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('🔀');

  const fetchDilemmas = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const { data: myData, error: myError } = await supabase
        .from('dilemmas')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      setDilemmas(myData || []);

      // DOPO:
      const { data: pubData, error: pubError } = await supabase
        .from('dilemmas')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (pubError) console.error('Errore caricamento community:', pubError.message);
      setPublicDilemmas(pubData || []);
    } catch (err) {
      console.error('Errore caricamento dilemmi:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDilemmas();
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

    const updated = [...dilemmas];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setDilemmas(updated);
    setDraggedIndex(null);

    try {
      const updates = updated.map((item, idx) =>
        supabase
          .from('dilemmas')
          .update({ position: idx })
          .eq('id', item.id)
          .eq('user_id', currentUser.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Errore salvataggio ordine:', err.message);
    }
  };

  // Creazione Dilemma
  const handleCreateDilemma = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const newDilemmaData = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        user_id: currentUser.id,
        owner_email: currentUser.email,
        position: dilemmas.length,
      };

      const { data: createdDilemma, error } = await supabase
        .from('dilemmas')
        .insert([newDilemmaData])
        .select()
        .single();

      if (error) throw error;

      if (creationMode === 'template' && selectedTemplate) {
        const nodeMap = {};

        for (const tmplNode of selectedTemplate.nodes) {
          const { data: createdNode, error: nodeErr } = await supabase
            .from('dilemma_nodes')
            .insert([{
              dilemma_id: createdDilemma.id,
              user_id: currentUser.id,
              title: tmplNode.title,
              content: tmplNode.content,
              is_root: tmplNode.is_root
            }])
            .select()
            .single();

          if (!nodeErr) {
            nodeMap[tmplNode.id] = createdNode.id;
            nodeMap[tmplNode.title] = createdNode.id;
          }
        }

        for (const tmplNode of selectedTemplate.nodes) {
          const currentNewNodeId = nodeMap[tmplNode.id];

          if (tmplNode.choices && tmplNode.choices.length > 0 && currentNewNodeId) {
            const choicesToInsert = tmplNode.choices.map((c) => ({
              node_id: currentNewNodeId,
              next_node_id: nodeMap[c.next_title] || nodeMap[c.next_node_id] || null,
              text: c.text,
              feedback: c.feedback
            }));

            await supabase.from('dilemma_choices').insert(choicesToInsert);
          }
        }
      }

      setDilemmas([createdDilemma, ...dilemmas]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');

      setActiveDilemma(createdDilemma);
    } catch (err) {
      alert('Errore creazione scenario: ' + err.message);
    }
  };

  // Abre la modale di modifica dettagli dello scenario
  const handleOpenEditDilemma = (e, item) => {
    e.stopPropagation();
    setEditingDilemma(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditIcon(item.icon || '🔀');
  };

  // Salva le modifiche ai dettagli dello scenario
  const handleUpdateDilemmaDetails = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingDilemma) return;

    try {
      const { data, error } = await supabase
        .from('dilemmas')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim(),
          icon: editIcon
        })
        .eq('id', editingDilemma.id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setDilemmas(dilemmas.map(d => d.id === editingDilemma.id ? data : d));
      setEditingDilemma(null);
    } catch (err) {
      alert('Errore aggiornamento scenario: ' + err.message);
    }
  };

  // Duplica un dilemma dalla Galleria Community
  const handleDuplicateDilemma = async (publicDilemma) => {
    try {
      setLoading(true);

      const newDilemmaData = {
        title: `${publicDilemma.title} (Copia)`,
        description: publicDilemma.description,
        icon: publicDilemma.icon,
        user_id: currentUser.id,
        owner_email: currentUser.email,
        is_public: false,
        position: dilemmas.length,
      };

      const { data: createdDilemma, error: dilemmaErr } = await supabase
        .from('dilemmas')
        .insert([newDilemmaData])
        .select()
        .single();

      if (dilemmaErr) throw dilemmaErr;

      const { data: originalNodes, error: nodesErr } = await supabase
        .from('dilemma_nodes')
        .select('*')
        .eq('dilemma_id', publicDilemma.id);

      if (nodesErr) throw nodesErr;

      if (originalNodes && originalNodes.length > 0) {
        const nodeMap = {};

        for (const origNode of originalNodes) {
          const { data: createdNode, error: nodeErr } = await supabase
            .from('dilemma_nodes')
            .insert([{
              dilemma_id: createdDilemma.id,
              user_id: currentUser.id,
              title: origNode.title,
              content: origNode.content,
              is_root: origNode.is_root
            }])
            .select()
            .single();

          if (!nodeErr) {
            nodeMap[origNode.id] = createdNode.id;
          }
        }

        const origNodeIds = originalNodes.map(n => n.id);
        const { data: originalChoices, error: choicesErr } = await supabase
          .from('dilemma_choices')
          .select('*')
          .in('node_id', origNodeIds);

        if (!choicesErr && originalChoices && originalChoices.length > 0) {
          const choicesToInsert = originalChoices
            .filter(c => nodeMap[c.node_id])
            .map(c => ({
              node_id: nodeMap[c.node_id],
              next_node_id: c.next_node_id ? nodeMap[c.next_node_id] || null : null,
              text: c.text,
              feedback: c.feedback
            }));

          if (choicesToInsert.length > 0) {
            await supabase.from('dilemma_choices').insert(choicesToInsert);
          }
        }
      }

      setDilemmas([createdDilemma, ...dilemmas]);
      setActiveTab('my-dilemmas');
      alert(`Scenario "${publicDilemma.title}" duplicato con successo nei tuoi dilemmi!`);
    } catch (err) {
      alert('Errore durante la duplicazione: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch Visibilità Pubblica/Privata
  const togglePublic = async (e, dilemma) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('dilemmas')
        .update({ is_public: !dilemma.is_public })
        .eq('id', dilemma.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setDilemmas(dilemmas.map(d => d.id === dilemma.id ? { ...d, is_public: !d.is_public } : d));
    } catch (err) {
      alert('Errore modifica visibilità: ' + err.message);
    }
  };

  // Elimina Dilemma
  const handleDeleteDilemma = async (e, dilemmaId, dilemmaTitle) => {
    e.stopPropagation();
    if (!window.confirm(`Eliminare lo scenario "${dilemmaTitle}" e tutti i suoi bivi?`)) return;

    try {
      const { error } = await supabase
        .from('dilemmas')
        .delete()
        .eq('id', dilemmaId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setDilemmas(dilemmas.filter(d => d.id !== dilemmaId));
    } catch (err) {
      alert('Errore eliminazione: ' + err.message);
    }
  };

  // VISTA EDITOR / PRESENTAZIONE
  if (activeDilemma) {
    return (
      <>
        <DilemmaEditor
          activeDilemma={activeDilemma}
          currentUser={currentUser}
          onBack={() => setActiveDilemma(null)}
          onOpenPresentation={() => setIsPresenting(true)}
        />

        {isPresenting && (
          <DilemmaPresentationModal
            activeDilemma={activeDilemma}
            onClose={() => setIsPresenting(false)}
          />
        )}
      </>
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

        {/* TITOLO + TABS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">🔀 Doceo Dilemma</h1>
            <p className="text-xs text-slate-500">Crea storie a bivio per Debate e percorsi d'apprendimento interattivi.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('my-dilemmas')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === 'my-dilemmas' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                📁 I Miei Dilemmi ({dilemmas.length})
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === 'community' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                🌐 Galleria Community ({publicDilemmas.length})
              </button>
            </div>

            <button
              onClick={() => {
                setCreationMode('scratch');
                setIsCreateModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              + Nuovo Dilemma
            </button>
          </div>
        </div>

        {/* MODALE CREAZIONE */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-black text-slate-900 mb-4">Crea Scenario Interattivo</h2>

              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCreationMode('scratch');
                    setSelectedTemplate(null);
                    setNewTitle('');
                    setNewDescription('');
                  }}
                  className={`py-2 rounded-lg transition cursor-pointer ${creationMode === 'scratch' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                >
                  ✏️ Da Zero
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('template')}
                  className={`py-2 rounded-lg transition cursor-pointer ${creationMode === 'template' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500'}`}
                >
                  📜 Da Template
                </button>
              </div>

              {creationMode === 'template' && (
                <div className="space-y-2 mb-4">
                  <label className="block text-xs font-bold text-slate-700">Scegli uno scenario di partenza:</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {DILEMMA_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplate(tmpl);
                          setNewTitle(tmpl.title);
                          setNewDescription(tmpl.description);
                          setNewIcon(tmpl.icon);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${selectedTemplate?.id === tmpl.id ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <span className="text-2xl">{tmpl.icon}</span>
                        <div>
                          <div className="font-bold text-slate-900">{tmpl.title}</div>
                          <div className="text-slate-500 text-[11px] line-clamp-1">{tmpl.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateDilemma} className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-16">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icona</label>
                    <input
                      type="text"
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titolo Scenario</label>
                    <input
                      type="text"
                      required
                      placeholder="es. La Decisione di Cesare"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione o Contesto</label>
                  <textarea
                    rows={3}
                    placeholder="Descrivi brevemente l'obiettivo o la traccia dello scenario..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Crea Dilemma
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE MODIFICA DETTAGLI SCENARIO */}
        {editingDilemma && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
              <h2 className="text-lg font-black text-slate-900 mb-4">✏️️ Modifica Dettagli Scenario</h2>

              <form onSubmit={handleUpdateDilemmaDetails} className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-16">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icona</label>
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titolo Scenario</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrizione o Contesto</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingDilemma(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTA SCHEDE */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-bold">Caricamento scenari...</div>
        ) : activeTab === 'my-dilemmas' ? (
          dilemmas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center my-8">
              <div className="text-4xl mb-2">🔀</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Nessun scenario creato</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Crea il tuo primo percorso a bivi per guidare il Debate o il ragionamento critico in classe.
              </p>
              <button
                onClick={() => {
                  setCreationMode('scratch');
                  setIsCreateModalOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                + Crea primo Dilemma
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dilemmas.map((item, index) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => setActiveDilemma(item)}
                  className="bg-white border border-slate-200 hover:border-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="text-2xl">{item.icon || '🔀'}</span>
                      <div className="flex items-center gap-1.5">

                        {/* SELETTORE PUBBLICO / PRIVATO INTUITIVO */}
                        <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 border border-slate-200 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.is_public) togglePublic(e, item);
                            }}
                            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${!item.is_public ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            title="Rendi privato"
                          >
                            🔒 Privato
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!item.is_public) togglePublic(e, item);
                            }}
                            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${item.is_public ? 'bg-purple-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            title="Condividi nella Community"
                          >
                            🌐 Pubblico
                          </button>
                        </div>

                        {/* PULSANTE MODIFICA NOME/DESCRIZIONE */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditDilemma(e, item)}
                          className="text-slate-400 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition text-xs cursor-pointer"
                          title="Modifica Titolo e Descrizione"
                        >
                          ✏️
                        </button>

                        {/* PULSANTE ELIMINA */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDilemma(e, item.id, item.title)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition text-xs cursor-pointer"
                          title="Elimina"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 text-base mb-1 group-hover:text-purple-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description || 'Nessuna descrizione'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                    <span>{new Date(item.created_at).toLocaleDateString('it-IT')}</span>
                    <span className="text-purple-600 font-bold group-hover:underline">Apri Editor →</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          publicDilemmas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center my-8">
              <div className="text-4xl mb-2">🌐</div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Nessuno scenario condiviso ancora</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Rendi pubblico uno dei tuoi dilemmi per metterlo a disposizione della community di docenti!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicDilemmas.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{item.icon || '🔀'}</span>
                      <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                        Community
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-base mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.description || 'Nessuna descrizione'}</p>
                    <span className="text-[10px] text-slate-400">Autore: {item.owner_email}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDuplicateDilemma(item)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-purple-200 transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow"
                    >
                      <span>📥</span>
                      <span>Duplica nei miei</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}