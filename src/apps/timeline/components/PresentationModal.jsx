import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PresentationModal({ events, activeTimeline, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentEvent = events[currentIndex];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                if (currentIndex < events.length - 1) setCurrentIndex((prev) => prev + 1);
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, events.length, onClose]);

    if (!currentEvent) return null;

    return createPortal(
        <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-white z-[9999] flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden top-0 left-0">
            {/* BARRA SUPERIORE */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
                <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        Modalità LIM / Presentazione
                    </span>
                    <h2 className="text-lg font-bold text-slate-300 mt-1">{activeTimeline?.title}</h2>
                </div>

                <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                    <span>✕ Chiudi</span>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">ESC</span>
                </button>
            </div>

            {/* CONTENUTO CENTRALE */}
            <div className="max-w-5xl mx-auto w-full my-auto flex flex-col items-center gap-4 py-2 overflow-hidden">
                {/* DATA E TITOLO */}
                <div className="text-center space-y-2 shrink-0">
                    <div>
                        <span className="text-xl md:text-2xl font-black bg-emerald-500 text-slate-950 px-6 py-2 rounded-2xl shadow-xl shadow-emerald-500/20 inline-block">
                            {currentEvent.date_display}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                        {currentEvent.title}
                    </h1>
                </div>

                {/* CONTENITORE COPERTINA + DESCRIZIONE */}
                <div className="w-full max-h-[50vh] flex flex-col md:flex-row items-center justify-center gap-4 my-auto">
                    {/* COPERTINA */}
                    {currentEvent.media_url && (
                        <div className="shrink-0 max-h-[45vh] flex justify-center items-center">
                            <img
                                src={currentEvent.media_url}
                                alt={currentEvent.title}
                                className="max-h-[45vh] max-w-[320px] md:max-w-[400px] object-contain rounded-3xl border border-slate-800 shadow-2xl"
                            />
                        </div>
                    )}

                    {/* DESCRIZIONE E PULSANTE ALLEGATO */}
                    <div
                        className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 text-slate-300 flex flex-col justify-between max-h-[45vh] overflow-y-auto shadow-2xl text-left ${currentEvent.media_url ? 'max-w-lg' : 'max-w-3xl'
                            }`}
                    >
                        {currentEvent.description && (
                            <p className="text-base md:text-xl font-medium leading-relaxed mb-4">
                                {currentEvent.description}
                            </p>
                        )}

                        {/* PULSANTE ALLEGATO COMPATTO IN LIM */}
                        {currentEvent.attachment_url && (
                            <div className="pt-3 border-t border-slate-800">
                                <a
                                    href={currentEvent.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold transition shadow"
                                >
                                    <span>📎</span>
                                    <span className="underline">{currentEvent.attachment_name || 'Documento'}</span>
                                    <span>↗</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRA DI NAVIGAZIONE IN BASSO */}
            <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div className="text-xs font-bold text-slate-400">
                    Evento <span className="text-emerald-400 font-extrabold">{currentIndex + 1}</span> di {events.length}
                </div>

                <div className="flex gap-2 overflow-x-auto py-1 max-w-md">
                    {events.map((evt, idx) => (
                        <button
                            key={evt.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2.5 rounded-full transition-all cursor-pointer ${idx === currentIndex
                                    ? 'w-8 bg-emerald-500'
                                    : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                                }`}
                            title={evt.title}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                        ← Precedente
                    </button>
                    <button
                        onClick={() => setCurrentIndex((prev) => Math.min(events.length - 1, prev + 1))}
                        disabled={currentIndex === events.length - 1}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-1 cursor-pointer"
                    >
                        Successivo →
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}