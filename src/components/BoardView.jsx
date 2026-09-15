import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import CardDetailModal from './CardDetailModal';
import { exportBoardToWord } from '../utils/exportBoard';
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

  const isViewer = activeBoard?.role === 'viewer';
  const [isPresenting, setIsPresenting] = useState(false);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleInput, setBoardTitleInput] = useState('');

  const [openColMenuId, setOpenColMenuId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState('');
  const [activeColorPickerColId, setActiveColorPickerColId] = useState(null);

  const [modalCard, setModalCard] = useState(null);
  const [modalColId, setModalColId] = useState(null);

  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedColIndex, setDraggedColIndex] = useState(null);
  const [dragOverCardColId, setDragOverCardColId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  useEffect(() => {
    if (!activeBoard) return;

    fetchBoardData();

    const channel = supabase
      .channel(`board-realtime-${activeBoard.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, () => fetchBoardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => fetchBoardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBoard]);

  const fetchBoardData = async () => {
    try {
      const { data: cols, error: colErr } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', activeBoard.id)
        .order('position', { ascending: true });

      if (colErr) throw colErr;
      setColumns(cols || []);

      if (cols && cols.length > 0) {
        const colIds = cols.map((c) => String(c.id));
        const { data: crds, error: cardErr } = await supabase
          .from('cards')
          .select('*, attachments(*)')
          .in('column_id', colIds)
          .order('position', { ascending: true });

        if (cardErr) throw cardErr;
        setCards(crds || []);
      } else {
        setCards([]);
      }
    } catch (err) {
      console.error('Errore recupero dati bacheca:', err.message);
    }
  };

  const handleSaveBoardTitle = async () => {
    if (isViewer || !boardTitleInput.trim()) {
      setIsEditingBoardTitle(false);
      return;
    }
    const newTitle = boardTitleInput.trim();
    try {
      setIsEditingBoardTitle(false);
      if (onBoardTitleChange) onBoardTitleChange(newTitle);

      await supabase.from('boards').update({ title: newTitle }).eq('id', activeBoard.id);
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
    } catch (err) {
      console.error('Errore aggiornamento colore:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!columnId) return;
    if (!window.confirm("Sei sicuro di voler eliminare questa colonna e le sue schede?")) return;

    try {
      const colIdStr = String(columnId);
      await supabase.from('cards').delete().eq('column_id', colIdStr);
      await supabase.from('columns').delete().eq('id', colIdStr);
      setColumns((prev) => prev.filter((c) => String(c.id) !== colIdStr));
    } catch (err) {
      alert('Errore eliminazione colonna: ' + err.message);
    }
  };

  const handleSaveCardFromModal = async () => {
    await fetchBoardData();
  };

  const handleDeleteCard = async (cardId) => {
    if (!cardId) return;
    try {
      await supabase.from('cards').delete().eq('id', cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      alert('Errore eliminazione scheda: ' + err.message);
    }
  };

  const handleCardDragStart = (e, card) => {
    console.log("🚀 DRAG START SCHEDA:", card.title);
    if (isViewer) return;
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
    setDraggedCard(null);
    setDragOverCardColId(null);
    setDragOverCardId(null);
  };

  const handleCardDrop = async (e, targetColumnId) => {
    if (isViewer || !draggedCard) return;
    e.preventDefault();
    e.stopPropagation();

    const targetColIdStr = String(targetColumnId);
    const sourceColIdStr = String(draggedCard.column_id);

    if (sourceColIdStr === targetColIdStr && (!dragOverCardId || dragOverCardId === draggedCard.id)) {
      handleCardDragEnd();
      return;
    }

    const otherCards = cards.filter((c) => String(c.column_id) !== targetColIdStr && c.id !== draggedCard.id);
    let targetColCards = cards.filter((c) => String(c.column_id) === targetColIdStr && c.id !== draggedCard.id);
    const updatedDraggedCard = { ...draggedCard, column_id: targetColIdStr };

    if (dragOverCardId) {
      const dropIndex = targetColCards.findIndex((c) => c.id === dragOverCardId);
      if (dropIndex !== -1) targetColCards.splice(dropIndex, 0, updatedDraggedCard);
      else targetColCards.push(updatedDraggedCard);
    } else {
      targetColCards.push(updatedDraggedCard);
    }

    const reorderedTargetCards = targetColCards.map((card, idx) => ({ ...card, position: idx }));
    setCards([...otherCards, ...reorderedTargetCards]);
    handleCardDragEnd();

    try {
      const updates = reorderedTargetCards.map((card) =>
        supabase.from('cards').update({ column_id: card.column_id, position: card.position }).eq('id', card.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Errore salvataggio ordine schede:', err);
      fetchBoardData();
    }
  };

  const handleColDragStart = (e, index) => {
    if (isViewer) return;
    setDraggedColIndex(index);
    setDraggedCard(null);
  };

  const handleColDragOver = (e, index) => {
    if (isViewer || draggedCard) return;
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === index) return;

    const reordered = [...columns];
    const [movedCol] = reordered.splice(draggedColIndex, 1);
    reordered.splice(index, 0, movedCol);

    setDraggedColIndex(index);
    setColumns(reordered);
  };

  const handleColDragEnd = async () => {
    if (isViewer || draggedColIndex === null) return;
    setDraggedColIndex(null);

    try {
      for (let i = 0; i < columns.length; i++) {
        await supabase.from('columns').update({ position: i }).eq('id', columns[i].id);
      }
    } catch (err) {
      console.error('Errore salvataggio colonne:', err);
    }
  };

  return (
    <div className="p-4">
      {/* BOX TEST DRAG */}
      <div
        draggable={true}
        onDragStart={() => console.log('✅ TEST DRAG START BOX GIALLO FUNZIONA!')}
        className="p-3 bg-yellow-300 text-slate-900 font-bold mb-4 rounded-xl text-center cursor-move shadow"
      >
        🟡 TEST DRAG: Trascina questo box per verificare la console (F12)
      </div>

      {/* BARRA SUPERIORE */}
      <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div onClick={onBack} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white font-black cursor-pointer">
            DS
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">{activeBoard?.title}</h1>
            <p className="text-xs text-slate-500">Utente: {currentUser?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold text-xs">
            ← Dashboard
          </button>
          {activeBoard?.isOwner && (
            <button onClick={onOpenShare} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs">
              Condividi
            </button>
          )}
          <button onClick={() => setIsPresenting(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg">
            ▶️ Presenta
          </button>
          <button onClick={() => exportBoardToWord(activeBoard?.title, columns, cards)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg font-bold text-xs">
            📝 Word
          </button>
          <button onClick={onLogout} className="bg-slate-100 hover:bg-red-50 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold">
            🚪 Esci
          </button>
        </div>
      </div>

      {/* AREA COLONNE */}
      <div className="flex gap-4 overflow-x-auto pb-6 items-start">
        {columns.map((col, colIdx) => {
          const colCards = cards.filter((c) => String(c.column_id) === String(col.id));
          const isTargetCardCol = dragOverCardColId === col.id;
          const colBgColor = col.color || 'bg-blue-600';

          return (
            <div
              key={col.id}
              draggable={!isViewer && !draggedCard}
              onDragStart={(e) => handleColDragStart(e, colIdx)}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedCard) setDragOverCardColId(col.id);
                else handleColDragOver(e, colIdx);
              }}
              onDrop={(e) => {
                if (draggedCard) handleCardDrop(e, col.id);
              }}
              onDragEnd={handleColDragEnd}
              className={`w-72 border rounded-2xl overflow-hidden flex-shrink-0 bg-slate-200/70 border-slate-300 ${isTargetCardCol ? 'bg-blue-100 border-blue-500' : ''
                }`}
            >
              {/* HEADER COLONNA */}
              <div className={`p-3 flex justify-between items-center text-white ${colBgColor}`}>
                <h3 className="font-bold text-base truncate">{col.name}</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{colCards.length}</span>
              </div>

              {/* SCHEDE DELLA COLONNA */}
              <div className="p-2.5 min-h-[120px]">
                <div className="space-y-2.5 mb-2">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable={true}
                      onDragStart={(e) => handleCardDragStart(e, card)}
                      onDragOver={(e) => handleCardDragOverCard(e, card)}
                      onDragEnd={handleCardDragEnd}
                      onClick={() => {
                        setModalCard(card);
                        setModalColId(col.id);
                      }}
                      className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm hover:border-blue-400 transition cursor-grab active:cursor-grabbing"
                    >
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{card.title}</h4>
                      {card.description && (
                        <div className="text-xs text-slate-600 line-clamp-2">
                          <ReactMarkdown>{card.description}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isViewer && (
                  <button
                    onClick={() => {
                      setModalColId(col.id);
                      setModalCard({ id: null, title: '', description: '', position: colCards.length });
                    }}
                    className="w-full py-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
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
              placeholder="Nome colonna..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs mb-2"
            />
            <button onClick={handleAddColumn} className="w-full bg-slate-800 text-white py-1.5 rounded-lg text-xs font-bold">
              + Aggiungi Colonna
            </button>
          </div>
        )}
      </div>

      {/* MODALE SCHEDA */}
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
          onSaveCard={handleSaveCardFromModal}
          onDeleteCard={handleDeleteCard}
        />
      )}

      {/* MODALE PRESENTAZIONE */}
      {isPresenting && (
        <PresentationModal
          cards={cards}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
}