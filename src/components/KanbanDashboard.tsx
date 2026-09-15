import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { BOARD_TEMPLATES } from '../data/templates';

// @ts-ignore
import BoardView from './BoardView';
// @ts-ignore
import Header from './Header';
// @ts-ignore
import BoardCard from './BoardCard';
// @ts-ignore
import CreateBoardModal from './CreateBoardModal';
// @ts-ignore
import ShareModal from './ShareModal';

interface KanbanDashboardProps {
  currentUser: any;
  onLogout: () => void;
}

export default function KanbanDashboard({ currentUser, onLogout }: KanbanDashboardProps) {
  const [boards, setBoards] = useState<any[]>([]);
  const [sharedBoards, setSharedBoards] = useState<any[]>([]);
  const [activeBoard, setActiveBoard] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBoards = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Mie bacheche
      const { data: ownData, error: ownErr } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (ownErr) throw ownErr;

      // 2. Bacheche condivise con me
      const { data: sharedData, error: sharedErr } = await supabase
        .from('board_members')
        .select('role, boards(*, owner_email)')
        .eq('invited_email', currentUser.email?.toLowerCase());

      if (sharedErr) console.error('Errore recupero condivise:', sharedErr);

      setBoards(ownData || []);

      const formattedShared = (sharedData || [])
        .filter((item: any) => item.boards)
        .map((item: any) => ({
          ...item.boards,
          userRole: item.role === 'editor' ? 'Editor' : 'Viewer',
          isShared: true,
        }));

      setSharedBoards(formattedShared);
    } catch (err) {
      console.error('Errore recupero bacheche:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [currentUser]);

  const handleCreateBoard = async (title: string, templateObj: any) => {
    try {
      const newBoardId = crypto.randomUUID();

      // 1. Inserisci la bacheca prendendo icona dal modello passato dal modale
      const newBoard = {
  id: newBoardId,
  title: title.trim(),
  icon: templateObj?.icon || '📘',
  user_id: currentUser.id,
  owner_email: currentUser.email, // <--- Aggiungi questa riga
};

      const { data: createdBoard, error: boardError } = await supabase
        .from('boards')
        .insert([newBoard])
        .select()
        .single();

      if (boardError) throw boardError;

      // 2. Se il modello passato ha colonne, inseriscile su Supabase
      if (templateObj?.columns && templateObj.columns.length > 0) {
        const columnsToInsert = templateObj.columns.map((col: any, index: number) => ({
          id: `col-${Date.now()}-${index}`,
          board_id: newBoardId,
          user_id: currentUser.id,
          name: col.name || col.title || col,
          color: col.color || 'bg-blue-600',
          position: index,
        }));

        const { error: colError } = await supabase
          .from('columns')
          .insert(columnsToInsert);

        if (colError) {
          console.error('Errore creazione colonne:', colError.message);
        }
      }

      // 3. Aggiorna lo stato e apri la bacheca
      setBoards([createdBoard, ...boards]);
      setIsCreateModalOpen(false);
      setActiveBoard({ ...createdBoard, isOwner: true, ownerEmail: currentUser.email });

    } catch (err: any) {
      alert('Errore creazione bacheca: ' + err.message);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa bacheca?')) return;

    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;
      setBoards(boards.filter((b) => b.id !== boardId));
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + err.message);
    }
  };

  const handleUpdateBoard = async (boardId: string, updates: Record<string, any>) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, ...updates } : b))
    );

    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;

    if (Object.keys(dbUpdates).length === 0) return;

    try {
      const { error } = await supabase
        .from('boards')
        .update(dbUpdates)
        .eq('id', boardId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Errore aggiornamento bacheca su DB:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {activeBoard ? (
        <>
          <BoardView
            activeBoard={activeBoard}
            currentUser={currentUser}
            onBack={() => {
              setActiveBoard(null);
              fetchBoards();
            }}
            onOpenShare={() => setIsShareModalOpen(true)}
            onLogout={onLogout}
            onBoardTitleChange={(newTitle: string) => {
              handleUpdateBoard(activeBoard.id, { title: newTitle });
              setActiveBoard((prev: any) => ({ ...prev, title: newTitle }));
            }}
          />

          {isShareModalOpen && activeBoard && (
            <ShareModal
              activeBoard={activeBoard}
              currentUserEmail={currentUser?.email}
              onClose={() => setIsShareModalOpen(false)}
            />
          )}
        </>
      ) : (
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex-1">
          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span> Torna a Doceo Suite
            </button>
          </div>

          <Header currentUser={currentUser} onLogout={onLogout} />

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-bold text-xs">
              Caricamento bacheche...
            </div>
          ) : (
            <div className="space-y-10 mt-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-black text-slate-900">Le mie bacheche</h2>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {boards.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-52 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/50 transition cursor-pointer text-slate-600 hover:text-blue-600 p-6 bg-white"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                      +
                    </div>
                    <span className="text-xs font-bold">Crea nuova bacheca</span>
                  </button>

                  {boards.map((board, index) => {
                   const boardData = {
                        ...board,
                        isOwner: false,
                        ownerEmail: board.owner_email || board.created_by_email || board.user_email || 'Condivisa',
                      };
                    return (
                      <BoardCard
                        key={board.id}
                        board={boardData}
                        index={index}
                        onSelect={() => setActiveBoard(boardData)}
                        onDelete={() => handleDeleteBoard(board.id)}
                        onUpdateBoard={handleUpdateBoard}
                      />
                    );
                  })}
                </div>
              </section>

              {sharedBoards.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-black text-slate-900">👥 Condivise con me</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      {sharedBoards.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sharedBoards.map((board, index) => {
                      const boardData = {
                        ...board,
                        isOwner: false,
                        ownerEmail: board.owner_email || 'Condivisa',
                      };
                      return (
                        <BoardCard
                          key={board.id}
                          board={boardData}
                          index={index}
                          onSelect={() => setActiveBoard(boardData)}
                          onUpdateBoard={handleUpdateBoard}
                        />
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {isCreateModalOpen && (
            <CreateBoardModal
              onClose={() => setIsCreateModalOpen(false)}
              onCreate={handleCreateBoard}
            />
          )}
        </div>
      )}
    </div>
  );
}