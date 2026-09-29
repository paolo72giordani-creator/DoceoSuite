import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';

export default function DilemmaEditor({ activeDilemma, currentUser, onBack, onOpenPresentation }) {
  const [nodes, setNodes] = useState([]);
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  // Modale/Form Primo Nodo / Nuovo Nodo
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeContent, setNodeContent] = useState('');

  // Modale Modifica Nodo
  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [editNodeTitle, setEditNodeTitle] = useState('');
  const [editNodeContent, setEditNodeContent] = useState('');

  // Modale Nuova Scelta/Bivio
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [choiceText, setChoiceText] = useState('');
  const [choiceFeedback, setChoiceFeedback] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');

  // Modale Modifica Scelta/Bivio
  const [editingChoice, setEditingChoice] = useState(null);
  const [editChoiceText, setEditChoiceText] = useState('');
  const [editChoiceFeedback, setEditChoiceFeedback] = useState('');
  const [editTargetNodeId, setEditTargetNodeId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: nodesData, error: nodesErr } = await supabase
        .from('dilemma_nodes')
        .select('*')
        .eq('dilemma_id', activeDilemma.id)
        .order('created_at', { ascending: true });

      if (nodesErr) throw nodesErr;
      setNodes(nodesData || []);

      if (nodesData && nodesData.length > 0) {
        const root = nodesData.find(n => n.is_root) || nodesData[0];
        setSelectedNode(root);

        const nodeIds = nodesData.map(n => n.id);
        const { data: choicesData, error: choicesErr } = await supabase
          .from('dilemma_choices')
          .select('*')
          .in('node_id', nodeIds);

        if (choicesErr) console.error('Errore scelte:', choicesErr);
        setChoices(choicesData || []);
      } else {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error('Errore caricamento dati scenario:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeDilemma.id]);

  // Salva Nuovo Nodo
  const handleSaveNode = async (e) => {
    e.preventDefault();
    if (!nodeTitle.trim()) return;

    try {
      const isFirst = nodes.length === 0;
      const { data, error } = await supabase
        .from('dilemma_nodes')
        .insert([{
          dilemma_id: activeDilemma.id,
          user_id: currentUser.id,
          title: nodeTitle.trim(),
          content: nodeContent.trim(),
          is_root: isFirst
        }])
        .select()
        .single();

      if (error) throw error;

      setNodes([...nodes, data]);
      setSelectedNode(data);
      setIsNodeModalOpen(false);
      setNodeTitle('');
      setNodeContent('');
    } catch (err) {
      alert('Errore creazione nodo: ' + err.message);
    }
  };

  const handleOpenEditNode = () => {
    if (!selectedNode) return;
    setEditNodeTitle(selectedNode.title);
    setEditNodeContent(selectedNode.content || '');
    setIsEditNodeModalOpen(true);
  };

  const handleUpdateNode = async (e) => {
    e.preventDefault();
    if (!editNodeTitle.trim() || !selectedNode) return;

    try {
      const { data, error } = await supabase
        .from('dilemma_nodes')
        .update({
          title: editNodeTitle.trim(),
          content: editNodeContent.trim()
        })
        .eq('id', selectedNode.id)
        .select()
        .single();

      if (error) throw error;

      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? data : n)));
      setSelectedNode(data);
      setIsEditNodeModalOpen(false);
    } catch (err) {
      alert('Errore aggiornamento nodo: ' + err.message);
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!window.confirm('Eliminare questo nodo e tutti i bivi associati?')) return;

    try {
      const { error } = await supabase
        .from('dilemma_nodes')
        .delete()
        .eq('id', nodeId);

      if (error) throw error;

      const updatedNodes = nodes.filter(n => n.id !== nodeId);
      setNodes(updatedNodes);
      setSelectedNode(updatedNodes.find(n => n.is_root) || updatedNodes[0] || null);
    } catch (err) {
      alert('Errore eliminazione nodo: ' + err.message);
    }
  };

  // Salva Nuova Scelta / Bivio
  const handleSaveChoice = async (e) => {
    e.preventDefault();
    if (!choiceText.trim() || !selectedNode) return;

    try {
      const { data, error } = await supabase
        .from('dilemma_choices')
        .insert([{
          node_id: selectedNode.id,
          next_node_id: targetNodeId || null,
          text: choiceText.trim(),
          feedback: choiceFeedback.trim()
        }])
        .select()
        .single();

      if (error) throw error;

      setChoices([...choices, data]);
      setIsChoiceModalOpen(false);
      setChoiceText('');
      setChoiceFeedback('');
      setTargetNodeId('');
    } catch (err) {
      alert('Errore creazione bivio: ' + err.message);
    }
  };

  // Apre la modale di modifica Bivio
  const handleOpenEditChoice = (choice) => {
    setEditingChoice(choice);
    setEditChoiceText(choice.text);
    setEditChoiceFeedback(choice.feedback || '');
    setEditTargetNodeId(choice.next_node_id || '');
  };

  // Salva le modifiche del Bivio
  const handleUpdateChoice = async (e) => {
    e.preventDefault();
    if (!editChoiceText.trim() || !editingChoice) return;

    try {
      const { data, error } = await supabase
        .from('dilemma_choices')
        .update({
          text: editChoiceText.trim(),
          feedback: editChoiceFeedback.trim(),
          next_node_id: editTargetNodeId || null
        })
        .eq('id', editingChoice.id)
        .select()
        .single();

      if (error) throw error;

      setChoices(choices.map(c => c.id === editingChoice.id ? data : c));
      setEditingChoice(null);
    } catch (err) {
      alert('Errore aggiornamento bivio: ' + err.message);
    }
  };

  // Elimina Scelta
  const handleDeleteChoice = async (choiceId) => {
    if (!window.confirm('Eliminare questo bivio di scelta?')) return;
    try {
      await supabase.from('dilemma_choices').delete().eq('id', choiceId);
      setChoices(choices.filter(c => c.id !== choiceId));
    } catch (err) {
      alert('Errore eliminazione scelta: ' + err.message);
    }
  };

  const currentNodeChoices = choices.filter(c => c.node_id === selectedNode?.id);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER EDITOR */}
        <div className="flex items-center justify-between mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              ← Torna alla Dashboard
            </button>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                <span>{activeDilemma.icon || '🔀'}</span>
                <span>{activeDilemma.title}</span>
              </h1>
              <p className="text-xs text-slate-400">{activeDilemma.description}</p>
            </div>
          </div>

          <button
            onClick={onOpenPresentation}
            disabled={nodes.length === 0}
            className={`font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md ${
              nodes.length > 0 ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            ▶️️ Presenta LIM
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold">Caricamento scenario...</div>
        ) : nodes.length === 0 ? (
          /* MASCHERA INIZIALE */
          <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-3xl p-10 max-w-xl mx-auto text-center my-10 shadow-2xl">
            <div className="text-4xl mb-3">🚩</div>
            <h2 className="text-lg font-black text-white mb-1">Crea la Situazione Iniziale</h2>
            <p className="text-xs text-slate-400 mb-6">
              Inizia definendo il primo passaggio (Nodo Start) che la classe vedrà all'apertura dello scenario.
            </p>

            <form onSubmit={handleSaveNode} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Titolo del Primo Passaggio</label>
                <input
                  type="text"
                  required
                  placeholder="es. 1. Il Dilemma del Senato"
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descrizione / Testo dello Scenario Iniziale</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Descrivi qui il contesto, i vincoli o il problema che gli studenti dovranno affrontare..."
                  value={nodeContent}
                  onChange={(e) => setNodeContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                🚀 Salva Primo Passaggio e Inizia
              </button>
            </form>
          </div>
        ) : (
          /* LAYOUT CON LISTA E PANNELLO DETTAGLIO */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PANNELLO SINISTRO: LISTA NODI */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between h-[600px]">
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                  <h3 className="font-black text-sm text-slate-200">Passaggi della Storia ({nodes.length})</h3>
                  <button
                    onClick={() => {
                      setNodeTitle('');
                      setNodeContent('');
                      setIsNodeModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                  >
                    + Nodo
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                  {nodes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedNode?.id === n.id
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="truncate font-bold flex items-center gap-1.5">
                        {n.is_root && <span title="Nodo Iniziale">🚩</span>}
                        <span>{n.title}</span>
                      </div>
                      <span className="text-[10px] opacity-60 shrink-0">
                        {choices.filter(c => c.node_id === n.id).length} bivi
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PANNELLO DESTRO: DETTAGLIO E MODIFICA NODO */}
            <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between h-[600px] overflow-y-auto">
              {selectedNode ? (
                <div>
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-700">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        {selectedNode.is_root ? 'Nodo Iniziale (Start)' : 'Passaggio Storia'}
                      </span>
                      <h2 className="text-xl font-black text-white">{selectedNode.title}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenEditNode}
                        className="bg-slate-700 hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 border border-slate-600"
                      >
                        <span>✏️</span>
                        <span>Modifica Testo</span>
                      </button>

                      <button
                        onClick={() => handleDeleteNode(selectedNode.id)}
                        className="bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white p-1.5 rounded-xl transition cursor-pointer text-xs"
                        title="Elimina Nodo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 text-xs text-slate-200 leading-relaxed mb-6">
                    <p className="whitespace-pre-line">{selectedNode.content || 'Nessun testo inserito per questo passaggio.'}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-black text-xs text-slate-300">Scelte e Conseguenze disponibili:</h4>
                      <button
                        onClick={() => setIsChoiceModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-xl text-xs transition cursor-pointer"
                      >
                        + Aggiungi Bivio
                      </button>
                    </div>

                    {currentNodeChoices.length === 0 ? (
                      <div className="border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-500 text-xs">
                        Nessuna scelta definita. Aggiungi un bivio per far avanzare la narrazione!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentNodeChoices.map((c) => {
                          const targetNode = nodes.find(n => n.id === c.next_node_id);
                          return (
                            <div key={c.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs flex justify-between items-center group">
                              <div className="pr-2">
                                <div className="font-bold text-emerald-400 mb-0.5">👉 {c.text}</div>
                                {c.feedback && <div className="text-slate-400 text-[11px] italic mb-1">{c.feedback}</div>}
                                <div className="text-[10px] text-purple-300 font-semibold">
                                  Porta a: {targetNode ? targetNode.title : '⚠ Nessun nodo collegato (Finale)'}
                                </div>
                              </div>

                              {/* PULSANTI AZIONE SUL BIVIO: SOLO ICONA MATITA + PATTUMIERA */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditChoice(c)}
                                  className="text-slate-400 hover:text-purple-300 hover:bg-slate-800 p-1.5 rounded-lg transition cursor-pointer text-xs"
                                  title="Modifica Bivio"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChoice(c.id)}
                                  className="text-slate-500 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-lg transition cursor-pointer text-xs"
                                  title="Elimina Bivio"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs">Seleziona o crea un nodo per iniziare.</div>
              )}
            </div>
          </div>
        )}

        {/* MODALE NUOVO NODO */}
        {isNodeModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 text-white rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-base font-black mb-4">➕ Aggiungi Passaggio / Nodo</h3>
              <form onSubmit={handleSaveNode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Titolo Passaggio</label>
                  <input
                    type="text"
                    required
                    placeholder="es. La Risposta dell'Assemblea"
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Testo dello Scenario</label>
                  <textarea
                    rows={4}
                    placeholder="Descrivi la situazione che la classe dovrà analizzare..."
                    value={nodeContent}
                    onChange={(e) => setNodeContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNodeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer"
                  >
                    Crea Nodo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE MODIFICA NODO */}
        {isEditNodeModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 text-white rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-base font-black mb-4">✏️ Modifica Passaggio / Nodo</h3>
              <form onSubmit={handleUpdateNode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Titolo Passaggio</label>
                  <input
                    type="text"
                    required
                    value={editNodeTitle}
                    onChange={(e) => setEditNodeTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Testo dello Scenario</label>
                  <textarea
                    rows={5}
                    required
                    value={editNodeContent}
                    onChange={(e) => setEditNodeContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditNodeModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE NUOVA SCELTA */}
        {isChoiceModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 text-white rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-base font-black mb-4">🔀 Aggiungi Bivio di Scelta</h3>
              <form onSubmit={handleSaveChoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Testo della Scelta (Pulsante)</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Sostieni la neutralità"
                    value={choiceText}
                    onChange={(e) => setChoiceText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Spiegazione / Feedback (Opzionale)</label>
                  <input
                    type="text"
                    placeholder="es. Questa scelta scatenerà la reazione della piazza..."
                    value={choiceFeedback}
                    onChange={(e) => setChoiceFeedback(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Porta al Nodo:</label>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Nessun nodo (Finale della storia) --</option>
                    {nodes.filter(n => n.id !== selectedNode?.id).map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChoiceModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold cursor-pointer"
                  >
                    Salva Bivio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE MODIFICA BIVIO ESISTENTE */}
        {editingChoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 text-white rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h3 className="text-base font-black mb-4">✏️ Modifica Bivio di Scelta</h3>
              <form onSubmit={handleUpdateChoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Testo della Scelta (Pulsante)</label>
                  <input
                    type="text"
                    required
                    value={editChoiceText}
                    onChange={(e) => setEditChoiceText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Spiegazione / Feedback (Opzionale)</label>
                  <input
                    type="text"
                    value={editChoiceFeedback}
                    onChange={(e) => setEditChoiceFeedback(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Porta al Nodo:</label>
                  <select
                    value={editTargetNodeId}
                    onChange={(e) => setEditTargetNodeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Nessun nodo (Finale della storia) --</option>
                    {nodes.filter(n => n.id !== selectedNode?.id).map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingChoice(null)}
                    className="px-4 py-2 rounded-xl bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer"
                  >
                    Salva Modifiche Bivio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}