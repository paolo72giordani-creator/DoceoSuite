import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import CardDetailModal from './CardDetailModal';
import { exportBoardToWord } from '../../../shared/utils/exportBoard';
import PresentationModal from './PresentationModal';
import ReactMarkdown from 'react-markdown';

const availableColors = [
  { label: 'Blu', value: 'bg-blue-600' },
  { label: 'Grigio', value: 'bg-slate-800' },
  { label: 'Indaco', value: 'bg-indigo-600' },
  { label: 'Smeraldo', value: 'bg-emerald-600' },
  { label: 'Ambra', value: 'bg-amber-600' },
  { label: 'Rosso', value: 'bg-rose-600' },
  { label: 'Viola', value: 'bg-purple-600' }
];

export default function BoardView({ activeBoard, currentUser, onBack, onOpenShare, onLogout, onBoardTitleChange }) {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');

  const isViewer = !activeBoard?.isOwner && (activeBoard?.userRole === 'Viewer' || activeBoard?.role === 'viewer');

  const [isPresenting, setIsPresenting] = useState(false);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState('');

  const [openColMenuId, setOpenColMenuId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState('');
  const [activeColorPickerColId, setActiveColorPickerColId] = useState(null);

  const [modalCard, setModalCard] = useState(null);
  const [modalColId, setModalColId] = useState(null);

  const boardId = activeBoard?.id || activeBoard?.board_id;

  // Drag & Drop State
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedColIndex, setDraggedColIndex] = useState(null);
  const [dragOverCardColId, setDragOverCardColId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  const isDraggingRef = useRef(false);
  const channelRef = useRef(null);

  const fetchBoardData = async () => {
    if (!activeBoard?.id) return;
    try {
      const { data: cols } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', activeBoard.id)
        .order('position', { ascending: true });

      setColumns(cols || []);

      if (cols && cols.length > 0) {
        const colIds = cols.map((c) => String(c.id));
        const { data: crds } = await supabase
          .from('cards')
          .select('*, attachments(*)')
          .in('column_id', colIds)
          .order('position', { ascending: true });

        setCards(crds || []);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Errore dati bacheca:', err);
    }
  };

  // Funzione broadcast per la sincronizzazione istantanea
  // 1. Funzione di notifica Broadcast istantanea
  // 1. Funzione di notifica Broadcast istantanea
  const notifyBoardUpdate = () => {
    const targetBoardId = activeBoard?.id || activeBoard?.board_id;
    if (!targetBoardId) return;

    const targetChannel = channelRef.current || supabase.channel(`board-room-${targetBoardId}`);
    targetChannel.send({
      type: 'broadcast',
      event: 'board_updated',
      payload: { updatedBy: currentUser?.email },
    });
  };

  // 2. Canale di ascolto Realtime
  useEffect(() => {
    const targetBoardId = activeBoard?.id || activeBoard?.board_id;
    if (!targetBoardId) return;

    fetchBoardData();

    const channelName = `board-room-${targetBoardId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${targetBoardId}` },
        () => {
          if (!isDraggingRef.current) fetchBoardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        () => {
          if (!isDraggingRef.current) fetchBoardData();
        }
      )
      .on('broadcast', { event: 'board_updated' }, () => {
        if (!isDraggingRef.current) fetchBoardData();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeBoard?.id, activeBoard?.board_id]);

  const handleSaveBoardTitle = async () => {
    if (isViewer) {
      setIsEditingBoardTitle(false);
      return;
    }
    const newTitle = boardTitleInput.trim();
    if (!newTitle) {
      setBoardTitleInput(activeBoard?.title || '');
      setIsEditingBoardTitle(false);
      return;
    }
    try {
      setIsEditingBoardTitle(false);
      if (onBoardTitleChange) onBoardTitleChange(newTitle);
      await supabase.from('boards').update({ title: newTitle }).eq('id', activeBoard.id);
      notifyBoardUpdate();
    } catch (err) {
      console.error('Errore rinomina bacheca:', err);
    }
  };

  const handleAddColumn = async () => {
    if (isViewer || !newColumnName.trim()) return;
    try {
      const newCol = {
        id: `col-${Date.now()}`,
        user_id: currentUser.id,
        board_id: activeBoard.id,
        name: newColumnName.trim(),
        position: columns.length,
        color: 'bg-blue-600'
      };
      const { data, error } = await supabase.from('columns').insert([newCol]).select();
      if (error) throw error;
      setColumns([...columns, data[0]]);
      setNewColumnName('');
      notifyBoardUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenameColumn = async (columnId) => {
    if (isViewer || !editingColName.trim()) {
      setEditingColId(null);
      return;
    }
    const updatedName = editingColName.trim();
    try {
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, name: updatedName } : c)));
      setEditingColId(null);
      await supabase.from('columns').update({ name: updatedName }).eq('id', columnId);
      notifyBoardUpdate();
    } catch (err) {
      console.error('Errore rinomina colonna:', err);
    }
  };

  const handleChangeColumnColor = async (columnId, newColor) => {
    if (isViewer) return;
    try {
      setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, color: newColor } : c)));
      setActiveColorPickerColId(null);
      setOpenColMenuId(null);
      await supabase.from('columns').update({ color: newColor }).eq('id', columnId);
      notifyBoardUpdate();
    } catch (err) {
      console.error('Errore cambio colore:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!columnId) return;
    if (!window.confirm("Attenzione: vuoi eliminare questa colonna e tutte le schede contenute?")) return;
    try {
      const colIdStr = String(columnId);
      await supabase.from('cards').delete().eq('column_id', colIdStr);
      await supabase.from('columns').delete().eq('id', colIdStr);
      setColumns((prev) => prev.filter((c) => String(c.id) !== colIdStr));
      setOpenColMenuId(null);
      notifyBoardUpdate();
    } catch (err) {
      alert('Errore eliminazione colonna: ' + err.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!cardId) return;
    try {
      await supabase.from('cards').delete().eq('id', cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      notifyBoardUpdate();
    } catch (err) {
      alert('Errore eliminazione scheda: ' + err.message);
    }
  };

  // --- DRAG SCHEDE ---
  const handleCardDragStart = (e, card) => {
    if (isViewer) return;
    isDraggingRef.current = true;
    e.stopPropagation();
    setDraggedCard(card);
    setDraggedColIndex(null);
  };

  const handleCardDragOverCard = (e, targetCard) => {
    if (isViewer || !draggedCard) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardColId(targetCard.column_id);
    setDragOverCardId(targetCard.id);
  };

  const handleCardDragEnd = () => {
    isDraggingRef.current = false;
    setDraggedCard(null);
    setDragOverCardColId(null);
    setDragOverCardId(null);
  };

  const handleCardDrop = async (e, targetColumnId) => {
    if (isViewer || !draggedCard) return;
    e.preventDefault();
    e.stopPropagation();

    const targetColIdStr = String(targetColumnId);
    const currentCard = { ...draggedCard };

    // Reset immediato stato visuale di drag
    setDraggedCard(null);
    setDragOverCardColId(null);
    setDragOverCardId(null);

    const otherCards = cards.filter((c) => String(c.column_id) !== targetColIdStr && c.id !== currentCard.id);
    let targetColCards = cards.filter((c) => String(c.column_id) === targetColIdStr && c.id !== currentCard.id);

    const updatedDraggedCard = { ...currentCard, column_id: targetColIdStr };

    if (dragOverCardId) {
      const dropIndex = targetColCards.findIndex((c) => c.id === dragOverCardId);
      if (dropIndex !== -1) {
        targetColCards.splice(dropIndex, 0, updatedDraggedCard);
      } else {
        targetColCards.push(updatedDraggedCard);
      }
    } else {
      targetColCards.push(updatedDraggedCard);
    }

    const reorderedTargetCards = targetColCards.map((card, idx) => ({
      ...card,
      position: idx
    }));

    // Aggiornamento ottimisitico stato locale
    setCards([...otherCards, ...reorderedTargetCards]);

    try {
      const updates = reorderedTargetCards.map((card) =>
        supabase
          .from('cards')
          .update({ column_id: card.column_id, position: card.position })
          .eq('id', card.id)
      );
      await Promise.all(updates);
      notifyBoardUpdate();
    } catch (err) {
      console.error('Errore salvataggio ordine schede:', err);
      fetchBoardData();
    } finally {
      isDraggingRef.current = false;
    }
  };

  // --- DRAG COLONNE ---
  const handleColDragStart = (e, index) => {
    if (isViewer || draggedCard) return;
    setDraggedColIndex(index);
  };

  const handleColDragOver = (e, index) => {
    if (isViewer || draggedCard || draggedColIndex === null || draggedColIndex === index) return;
    e.preventDefault();
    const reordered = [...columns];
    const [movedCol] = reordered.splice(draggedColIndex, 1);
    reordered.splice(index, 0, movedCol);
    setDraggedColIndex(index);
    setColumns(reordered);
  };

  const handleColDragEnd = async () => {
    if (draggedColIndex === null) return;
    setDraggedColIndex(null);
    try {
      for (let i = 0; i < columns.length; i++) {
        await supabase.from('columns').update({ position: i }).eq('id', columns[i].id);
      }
      notifyBoardUpdate();
    } catch (err) {
      console.error('Errore ordine colonne:', err);
    }
  };

  return (
    <div
      className="p-4 font-sans min-h-screen"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCardDragEnd}
      onClick={() => {
        setOpenColMenuId(null);
        setActiveColorPickerColId(null);
      }}
    >
      {/* BARRA SUPERIORE */}
      <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div onClick={onBack} className="w-10 h-10 bg-slate-900 text-white font-black rounded-xl flex items-center justify-center cursor-pointer shadow">
            DS
          </div>
          <div>
            {!isEditingBoardTitle ? (
              <h1
                onClick={() => {
                  if (!isViewer && activeBoard?.isOwner) {
                    setBoardTitleInput(activeBoard?.title || '');
                    setIsEditingBoardTitle(true);
                  }
                }}
                className={`text-lg font-black text-slate-900 flex items-center gap-2 ${!isViewer && activeBoard?.isOwner ? 'cursor-pointer hover:text-blue-600' : ''
                  }`}
              >
                <span>{activeBoard?.title}</span>
                {!isViewer && activeBoard?.isOwner && <span className="text-xs text-slate-400">✏️</span>}
              </h1>
            ) : (
              <input
                type="text"
                value={boardTitleInput}
                onChange={(e) => setBoardTitleInput(e.target.value)}
                onBlur={handleSaveBoardTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveBoardTitle();
                  if (e.key === 'Escape') {
                    setBoardTitleInput(activeBoard?.title || '');
                    setIsEditingBoardTitle(false);
                  }
                }}
                autoFocus
                className="border border-blue-500 rounded px-2 py-0.5 text-base font-extrabold text-slate-900 focus:outline-none"
              />
            )}

            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              <span>Utente: {currentUser?.email}</span>
              {!activeBoard?.isOwner && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">
                    Proprietario: {activeBoard?.ownerEmail || 'Sconosciuto'}
                  </span>
                </>
              )}
              {isViewer && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 font-bold ml-1">
                  👁️ Sola Lettura
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs">
            ← Dashboard
          </button>
          {activeBoard?.isOwner && (
            <button onClick={onOpenShare} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs">
              Condividi
            </button>
          )}
          <button onClick={() => setIsPresenting(true)} className="bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg">
            ▶️ Presenta
          </button>
          <button onClick={() => exportBoardToWord(activeBoard?.title || 'Bacheca', columns, cards)} className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold text-xs">
            📝 Word
          </button>
          <button onClick={onLogout} className="bg-slate-100 hover:bg-red-50 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold">
            🚪 Esci
          </button>
        </div>
      </div>

      {/* AREA COLONNE KANBAN */}
      <div className="flex gap-4 overflow-x-auto pb-6 items-start">
        {columns.map((col, colIdx) => {
          const colCards = cards.filter((c) => String(c.column_id) === String(col.id));
          const isTargetCardCol = dragOverCardColId === col.id;
          const isMenuOpen = openColMenuId === col.id;
          const isPickerOpen = activeColorPickerColId === col.id;
          const isEditingThisCol = editingColId === col.id;

          return (
            <div
              key={col.id}
              draggable={!isViewer && !draggedCard && !isEditingThisCol}
              onDragStart={(e) => handleColDragStart(e, colIdx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedCard) setDragOverCardColId(col.id);
                else handleColDragOver(e, colIdx);
              }}
              onDragEnd={handleColDragEnd}
              onDrop={(e) => handleCardDrop(e, col.id)}
              className={`w-72 bg-slate-200/70 border rounded-2xl overflow-hidden flex-shrink-0 shadow-sm transition ${isTargetCardCol ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50/30' : 'border-slate-300'
                }`}
            >
              {/* HEADER COLONNA */}
              <div className={`p-3 font-bold text-white flex justify-between items-center relative ${col.color || 'bg-blue-600'} ${!isViewer && !isEditingThisCol ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                {!isEditingThisCol ? (
                  <h3 className="font-bold text-base flex items-center gap-1.5 flex-1 pr-2 truncate">
                    {!isViewer && <span className="opacity-60 text-xs">⋮⋮</span>}
                    <span
                      onClick={(e) => {
                        if (!isViewer) {
                          e.stopPropagation();
                          setEditingColId(col.id);
                          setEditingColName(col.name);
                        }
                      }}
                      className={!isViewer ? 'cursor-pointer hover:underline' : ''}
                    >
                      {col.name}
                    </span>
                  </h3>
                ) : (
                  <input
                    type="text"
                    value={editingColName}
                    onChange={(e) => setEditingColName(e.target.value)}
                    onBlur={() => handleRenameColumn(col.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(col.id)}
                    autoFocus
                    className="w-full bg-white text-slate-900 font-bold text-sm px-2 py-1 rounded focus:outline-none"
                  />
                )}

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    {colCards.length}
                  </span>

                  {!isViewer && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenColMenuId(isMenuOpen ? null : col.id);
                          setActiveColorPickerColId(null);
                        }}
                        className="w-6 h-6 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/20 rounded-full transition font-bold text-sm leading-none"
                      >
                        ⋮
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xl z-30 w-36 text-xs text-slate-800 space-y-0.5"
                        >
                          <button
                            onClick={() => {
                              setEditingColId(col.id);
                              setEditingColName(col.name);
                              setOpenColMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-2"
                          >
                            ✏️ Rinomina
                          </button>

                          <button
                            onClick={() => {
                              setActiveColorPickerColId(isPickerOpen ? null : col.id);
                              setOpenColMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-2"
                          >
                            🎨 Cambia colore
                          </button>

                          <button
                            onClick={() => handleDeleteColumn(col.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-semibold rounded-lg flex items-center gap-2 border-t border-slate-100 mt-1 pt-1"
                          >
                            🗑️ Elimina
                          </button>
                        </div>
                      )}

                      {isPickerOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl p-2 shadow-xl z-30 flex gap-1.5"
                        >
                          {availableColors.map((c) => (
                            <button
                              key={c.value}
                              onClick={() => handleChangeColumnColor(col.id, c.value)}
                              className={`w-5 h-5 rounded-full border border-black/10 transition hover:scale-110 ${c.value}`}
                              title={c.label}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AREA SCHEDE COLONNA */}
              <div
                className="p-2.5 space-y-2.5 min-h-[160px]"
                onDragOver={(e) => {
                  if (draggedCard) {
                    e.preventDefault();
                    setDragOverCardColId(col.id);
                  }
                }}
                onDrop={(e) => handleCardDrop(e, col.id)}
              >
                {colCards.map((card) => {
                  const isBeingDragged = draggedCard?.id === card.id;
                  const isDragOverThisCard = dragOverCardId === card.id && draggedCard?.id !== card.id;

                  return (
                    <React.Fragment key={card.id}>
                      {isDragOverThisCard && (
                        <div className="border-2 border-dashed border-blue-500 bg-blue-50/90 rounded-xl p-3 text-center text-blue-600 text-xs font-bold shadow-inner flex items-center justify-center gap-1">
                          📍 Rilascia qui
                        </div>
                      )}

                      <div
                        draggable={!isViewer}
                        onDragStart={(e) => handleCardDragStart(e, card)}
                        onDragOver={(e) => handleCardDragOverCard(e, card)}
                        onDragEnd={handleCardDragEnd}
                        onClick={() => {
                          setModalCard(card);
                          setModalColId(col.id);
                        }}
                        className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-blue-400 cursor-grab active:cursor-grabbing transition relative ${isBeingDragged ? 'opacity-30 border-dashed border-blue-500 scale-95' : ''
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 text-sm">{card.title || 'Senza titolo'}</h4>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Eliminare questa scheda?')) handleDeleteCard(card.id);
                              }}
                              className="text-slate-400 hover:text-red-500 text-xs"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        {card.description && (
                          <div className="text-xs text-slate-600 line-clamp-2 mb-1">
                            <ReactMarkdown>{card.description}</ReactMarkdown>
                          </div>
                        )}

                        {card.attachments && card.attachments.length > 0 && (
                          <div className="mt-2 pt-1 border-t border-slate-100 space-y-1">
                            {card.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 truncate"
                              >
                                📎 {att.file_name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* TARGET ESPLICITO DROP IN FONDO */}
                {isTargetCardCol && draggedCard && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverCardColId(col.id);
                      setDragOverCardId(null);
                    }}
                    onDrop={(e) => handleCardDrop(e, col.id)}
                    className={`border-2 border-dashed rounded-xl p-3 text-center text-xs font-bold transition-all my-1 flex items-center justify-center gap-1 ${!dragOverCardId
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-inner scale-[1.01]'
                      : 'border-slate-300 text-slate-400 opacity-60'
                      }`}
                  >
                    📍 Rilascia qui in fondo
                  </div>
                )}

                {!isViewer && (
                  <button
                    onClick={() => {
                      setModalColId(col.id);
                      setModalCard({ id: null, title: '', description: '', position: colCards.length });
                    }}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition mt-1"
                  >
                    + Aggiungi scheda
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!isViewer && (
          <div className="w-72 bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3 flex-shrink-0">
            <input
              type="text"
              placeholder="Nome nuova colonna..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs mb-2 focus:outline-none"
            />
            <button onClick={handleAddColumn} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-1.5 rounded-lg text-xs font-bold transition">
              + Aggiungi Colonna
            </button>
          </div>
        )}
      </div>

      {/* MODALI */}
      {(modalCard !== null || modalColId !== null) && (
        <CardDetailModal
          card={modalCard}
          columnId={modalColId}
          currentUser={currentUser}
          isViewer={isViewer}
          onClose={() => {
            setModalCard(null);
            setModalColId(null);
          }}
          onSaveCard={() => {
            fetchBoardData();
            notifyBoardUpdate(); // <-- INDISPENSABILE per aggiornare l'ospite quando l'owner salva dal modal
          }}
          onDeleteCard={(cardId) => {
            handleDeleteCard(cardId);
            notifyBoardUpdate();
          }}
        />
      )}

      {isPresenting && (
        <PresentationModal
          cards={cards}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
}