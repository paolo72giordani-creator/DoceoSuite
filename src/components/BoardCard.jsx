import React, { useState, useEffect, useRef } from 'react';

const colorPalette = [
  { id: 'emerald', bg: 'bg-emerald-50/90 border-emerald-200 hover:border-emerald-400', circle: 'bg-emerald-100 border-emerald-300' },
  { id: 'blue', bg: 'bg-blue-50/90 border-blue-200 hover:border-blue-400', circle: 'bg-blue-100 border-blue-300' },
  { id: 'rose', bg: 'bg-rose-50/90 border-rose-200 hover:border-rose-400', circle: 'bg-rose-100 border-rose-300' },
  { id: 'amber', bg: 'bg-amber-50/90 border-amber-200 hover:border-amber-400', circle: 'bg-amber-100 border-amber-300' },
  { id: 'purple', bg: 'bg-purple-50/90 border-purple-200 hover:border-purple-400', circle: 'bg-purple-100 border-purple-300' },
  { id: 'teal', bg: 'bg-teal-50/90 border-teal-200 hover:border-teal-400', circle: 'bg-teal-100 border-teal-300' },
  { id: 'indigo', bg: 'bg-indigo-50/90 border-indigo-200 hover:border-indigo-400', circle: 'bg-indigo-100 border-indigo-300' },
];

const availableIcons = ['📄', '📘', '📚', '🏫', '👥', '💡', '🎨', '🧠', '🔬', '🌍', '📐', '🎯'];

export default function BoardCard({
  board,
  index = 0,
  onSelect,
  onDelete,
  onUpdateBoard,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(board.title || '');
  const menuRef = useRef(null);

  useEffect(() => {
    setTitleInput(board.title || '');
  }, [board.title]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentColorObj =
    colorPalette.find(
      (c) => c.id === board.color_theme || c.bg === board.color_theme
    ) || colorPalette[index % colorPalette.length];

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput.trim() !== board.title && onUpdateBoard) {
      onUpdateBoard(board.id, { title: titleInput.trim() });
    }
  };

  const handleSelectIcon = (icon, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (onUpdateBoard) {
      onUpdateBoard(board.id, { icon });
    }
  };

  const handleSelectColor = (colorItem, e) => {
    e.stopPropagation();
    setActiveMenu(null);
    if (onUpdateBoard) {
      onUpdateBoard(board.id, { color_theme: colorItem.id });
    }
  };

  return (
    <div
      onClick={() => {
        if (!isEditingTitle && !activeMenu && onSelect) {
          onSelect(board.id);
        }
      }}
      className={`relative cursor-pointer rounded-2xl p-5 border-2 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-52 ${currentColorObj.bg}`}
    >
      <div>
        {/* HEADER: ICONA, BADGE RUOLO E 3 PUNTINI */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/90 shadow-sm flex items-center justify-center text-xl border border-black/5">
            {board.icon || '📘'}
          </div>

          <div className="flex items-center gap-2" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            {/* BADGE VIOLA PER BACHECHE CONDIVISE */}
            {board.userRole && (
              <span className="bg-indigo-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                {board.userRole}
              </span>
            )}

            <button
              onClick={() => setActiveMenu(activeMenu ? null : 'main')}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition text-base font-bold"
              title="Opzioni bacheca"
            >
              ⋮
            </button>

            {/* POPUP MENU PRINCIPALE */}
            {activeMenu === 'main' && (
              <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-30 w-40 text-xs text-slate-800 space-y-0.5">
                <button
                  onClick={() => {
                    setActiveMenu(null);
                    setIsEditingTitle(true);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-2"
                >
                  ✏️ Rinomina
                </button>
                <button
                  onClick={() => setActiveMenu('icon')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-2"
                >
                  😜 Cambia icona
                </button>
                <button
                  onClick={() => setActiveMenu('color')}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-xl font-semibold flex items-center gap-2"
                >
                  🎨 Cambia colore
                </button>
                {board.isOwner && (
                  <button
                    onClick={() => {
                      setActiveMenu(null);
                      if (onDelete) onDelete(board.id);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-semibold rounded-xl flex items-center gap-2 border-t border-slate-100 mt-1"
                  >
                    🗑️ Elimina
                  </button>
                )}
              </div>
            )}

            {/* SELEZIONE ICONA */}
            {activeMenu === 'icon' && (
              <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl z-30 grid grid-cols-4 gap-2 w-48">
                {availableIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={(e) => handleSelectIcon(icon, e)}
                    className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition hover:scale-110 ${
                      board.icon === icon ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-slate-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}

            {/* SELEZIONE COLORE */}
            {activeMenu === 'color' && (
              <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xl z-30 grid grid-cols-4 gap-2.5 w-44">
                {colorPalette.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleSelectColor(item, e)}
                    className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 ${item.circle} ${
                      currentColorObj.id === item.id ? 'ring-2 ring-blue-500 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TITOLO O INPUT INLINE */}
        {!isEditingTitle ? (
          <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-3">
            {board.title}
          </h3>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="w-full bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none shadow-sm"
            />
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-200/60 pt-3 flex justify-between items-center text-xs font-semibold text-slate-400">
        <span>{board.isOwner ? 'Personale' : 'Condivisa'}</span>
      </div>
    </div>
  );
}