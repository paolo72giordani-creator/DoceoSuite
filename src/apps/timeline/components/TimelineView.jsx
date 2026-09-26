import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';
import PresentationModal from './PresentationModal';

export default function TimelineView({ activeTimeline, currentUser, onBack }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPresenting, setIsPresenting] = useState(false);

    const scrollContainerRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    // Modale inserimento/modifica
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDescription, setEventDescription] = useState('');

    // Media
    const [mediaUrl, setMediaUrl] = useState('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentName, setAttachmentName] = useState('');
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    // Drag & Drop
    const [draggedIndex, setDraggedIndex] = useState(null);

    const fetchEvents = async () => {
        if (!activeTimeline?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('timeline_events')
                .select('*')
                .eq('timeline_id', activeTimeline.id)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error('Errore caricamento eventi:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [activeTimeline?.id]);

    // FUNZIONE DI UTILITY PER RIMUOVERE FILE DA STORAGE TRAMITE URL
    const deleteFileFromStorage = async (publicUrl) => {
        if (!publicUrl) return;
        try {
            // Estrae il path interno al bucket 'card-attachments' dall'URL pubblico
            const urlParts = publicUrl.split('/card-attachments/');
            if (urlParts.length > 1) {
                const filePath = decodeURIComponent(urlParts[1]);
                await supabase.storage.from('card-attachments').remove([filePath]);
            }
        } catch (err) {
            console.error('Errore rimozione file da Storage:', err);
        }
    };

    // ESPORTA IN WORD (.DOC)
    const handleExportWord = () => {
        if (events.length === 0) return alert('Nessun evento da esportare.');

        let content = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset='utf-8'>
            <title>${activeTimeline.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 5px; }
              p.subtitle { color: #666; font-style: italic; margin-bottom: 30px; }
              table.event-card { width: 100%; max-width: 650px; border: 1px solid #d1d5db; border-collapse: collapse; margin-bottom: 25px; background-color: #f9fafb; border-radius: 8px; }
              td.card-body { padding: 16px; text-align: left; vertical-align: top; }
              .event-date { font-weight: bold; color: #059669; font-size: 14px; margin-bottom: 6px; }
              .event-title { font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #111827; }
              .event-desc { font-size: 13px; line-height: 1.6; color: #374151; margin-top: 10px; margin-bottom: 12px; }
              a.attachment-link { font-size: 12px; font-weight: bold; color: #059669; text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>${activeTimeline.title}</h1>
            <p class="subtitle">${activeTimeline.description || ''}</p>
        `;

        events.forEach((evt, idx) => {
            content += `
            <table class="event-card" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="card-body">
                  <div class="event-date">📍 ${evt.date_display}</div>
                  <div class="event-title">${idx + 1}. ${evt.title}</div>
                  
                  ${
                    evt.media_url
                      ? `<div style="text-align: center; margin: 12px 0;">
                          <img src="${evt.media_url}" style="max-width: 100%; max-height: 350px; width: auto; height: auto; border-radius: 6px;" alt="Copertina" />
                         </div>`
                      : ''
                  }
                  
                  ${evt.description ? `<div class="event-desc">${evt.description}</div>` : ''}
                  
                  ${
                    evt.attachment_url
                      ? `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                          <a href="${evt.attachment_url}" class="attachment-link" target="_blank">
                            📎 Allegato: ${evt.attachment_name || 'Apri Documento'}
                          </a>
                         </div>`
                      : ''
                  }
                </td>
              </tr>
            </table>
          `;
        });

        content += `</body></html>`;

        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTimeline.title.replace(/\s+/g, '_')}_timeline.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // SCORRIMENTO ROLL-OVER
    const startHoverScroll = (direction) => {
        stopHoverScroll();
        const speed = direction === 'left' ? -8 : 8;
        scrollIntervalRef.current = setInterval(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollLeft += speed;
            }
        }, 12);
    };

    const stopHoverScroll = () => {
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopHoverScroll();
    }, []);

    // CARICAMENTO COPERTINA
    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingCover(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_cover.${fileExt}`;
            const filePath = `timeline/covers/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('card-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('card-attachments')
                .getPublicUrl(filePath);

            // Se stiamo sostituendo un'immagine esistente, rimuoviamo quella vecchia dallo storage
            if (mediaUrl) {
                await deleteFileFromStorage(mediaUrl);
            }

            setMediaUrl(publicUrlData.publicUrl);
        } catch (err) {
            alert('Errore caricamento copertina: ' + err.message);
        } finally {
            setUploadingCover(false);
        }
    };

    // CARICAMENTO ALLEGATO
    const handleAttachmentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAttachment(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_file.${fileExt}`;
            const filePath = `timeline/docs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('card-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('card-attachments')
                .getPublicUrl(filePath);

            // Se stiamo sostituendo un allegato esistente, rimuoviamo quello vecchio dallo storage
            if (attachmentUrl) {
                await deleteFileFromStorage(attachmentUrl);
            }

            setAttachmentUrl(publicUrlData.publicUrl);
            setAttachmentName(file.name);
        } catch (err) {
            alert('Errore caricamento allegato: ' + err.message);
        } finally {
            setUploadingAttachment(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingEvent(null);
        setEventTitle('');
        setEventDate('');
        setEventDescription('');
        setMediaUrl('');
        setAttachmentUrl('');
        setAttachmentName('');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (evt) => {
        setEditingEvent(evt);
        setEventTitle(evt.title || '');
        setEventDate(evt.date_display || '');
        setEventDescription(evt.description || '');
        setMediaUrl(evt.media_url || '');
        setAttachmentUrl(evt.attachment_url || '');
        setAttachmentName(evt.attachment_name || '');
        setIsModalOpen(true);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!eventTitle.trim() || !eventDate.trim()) return;

        try {
            if (editingEvent) {
                const { data, error } = await supabase
                    .from('timeline_events')
                    .update({
                        title: eventTitle.trim(),
                        date_display: eventDate.trim(),
                        description: eventDescription.trim(),
                        media_url: mediaUrl,
                        attachment_url: attachmentUrl,
                        attachment_name: attachmentName,
                    })
                    .eq('id', editingEvent.id)
                    .select();

                if (error) throw error;
                setEvents(events.map((e) => (e.id === editingEvent.id ? data[0] : e)));
            } else {
                const newOrder = events.length;
                const { data, error } = await supabase
                    .from('timeline_events')
                    .insert([
                        {
                            timeline_id: activeTimeline.id,
                            user_id: currentUser.id,
                            title: eventTitle.trim(),
                            date_display: eventDate.trim(),
                            description: eventDescription.trim(),
                            media_url: mediaUrl,
                            attachment_url: attachmentUrl,
                            attachment_name: attachmentName,
                            sort_order: newOrder,
                        },
                    ])
                    .select();

                if (error) throw error;
                setEvents([...events, data[0]]);
            }

            setIsModalOpen(false);
        } catch (err) {
            alert('Errore salvataggio: ' + err.message);
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const reorderedEvents = [...events];
        const [movedEvent] = reorderedEvents.splice(draggedIndex, 1);
        reorderedEvents.splice(index, 0, movedEvent);

        setDraggedIndex(index);
        setEvents(reorderedEvents);
    };

    const handleDragEnd = async () => {
        if (draggedIndex === null) return;
        setDraggedIndex(null);

        try {
            const updates = events.map((evt, idx) =>
                supabase
                    .from('timeline_events')
                    .update({ sort_order: idx })
                    .eq('id', evt.id)
            );
            await Promise.all(updates);
        } catch (err) {
            console.error('Errore riordinamento:', err);
            fetchEvents();
        }
    };

    // ELIMINAZIONE PULITA EVENTO E RELATIVI FILE DAL BUCKET
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Eliminare questo evento e tutti i file allegati?')) return;
        try {
            const eventToDelete = events.find((e) => e.id === eventId);

            if (eventToDelete) {
                // 1. Elimina eventuale immagine di copertina dallo Storage
                if (eventToDelete.media_url) {
                    await deleteFileFromStorage(eventToDelete.media_url);
                }

                // 2. Elimina eventuale file allegato dallo Storage
                if (eventToDelete.attachment_url) {
                    await deleteFileFromStorage(eventToDelete.attachment_url);
                }
            }

            // 3. Elimina la riga dell'evento dal Database
            const { error } = await supabase
                .from('timeline_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            setEvents(events.filter((e) => e.id !== eventId));
        } catch (err) {
            alert('Errore eliminazione: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* HEADER CON PULSANTI RIORDINATI SU UN'UNICA RIGA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap"
                        >
                            ← Torna
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-white">{activeTimeline.title}</h1>
                            <p className="text-xs text-slate-400">{activeTimeline.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-nowrap">
                        {/* 1. AGGIUNGI EVENTO */}
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                        >
                            + Aggiungi Evento
                        </button>

                        {events.length > 0 && (
                            <>
                                {/* 2. PRESENTA LIM */}
                                <button
                                    onClick={() => setIsPresenting(true)}
                                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                                >
                                    ▶️ Presenta LIM
                                </button>

                                {/* 3. ESPORTA WORD */}
                                <button
                                    onClick={handleExportWord}
                                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer whitespace-nowrap border border-slate-600 flex items-center gap-1.5"
                                    title="Esporta timeline in formato Word"
                                >
                                    📝 Esporta Word
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* MODALE EVENTO */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-800 text-white rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg font-black mb-4">
                                {editingEvent ? '✏️ Modifica Evento' : '➕ Nuovo Evento'}
                            </h2>
                            <form onSubmit={handleSaveEvent} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Data / Periodo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="es. 14 Luglio 1789"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Titolo Evento</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="es. Presa della Bastiglia"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Descrizione</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Dettagli..."
                                        value={eventDescription}
                                        onChange={(e) => setEventDescription(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                                    />
                                </div>

                                {/* COPERTINA */}
                                <div className="border-t border-slate-700 pt-3">
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        🖼️ Immagine di Copertina
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverUpload}
                                        disabled={uploadingCover}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                                    />
                                    {uploadingCover && <p className="text-[10px] text-emerald-400 mt-1 font-bold">Caricamento copertina...</p>}
                                    {mediaUrl && (
                                        <div className="mt-2 relative">
                                            <img src={mediaUrl} alt="Preview" className="h-20 w-full object-cover rounded-xl border border-slate-700" />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await deleteFileFromStorage(mediaUrl);
                                                    setMediaUrl('');
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ALLEGATO */}
                                <div className="border-t border-slate-700 pt-3">
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        📎 File Allegato (PDF, Doc, Video, Audio...)
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleAttachmentUpload}
                                        disabled={uploadingAttachment}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                                    />
                                    {uploadingAttachment && <p className="text-[10px] text-emerald-400 mt-1 font-bold">Caricamento allegato...</p>}
                                    {attachmentUrl && (
                                        <div className="mt-2 bg-slate-900 p-2 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                                            <span className="truncate max-w-[200px] text-slate-300 font-medium">📄 {attachmentName || 'Allegato'}</span>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await deleteFileFromStorage(attachmentUrl);
                                                    setAttachmentUrl('');
                                                    setAttachmentName('');
                                                }}
                                                className="text-red-400 font-bold text-xs hover:text-red-300 px-2 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-700 text-xs font-bold cursor-pointer"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploadingCover || uploadingAttachment}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold cursor-pointer"
                                    >
                                        Salva Evento
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CAROSELLO EVENTI STILE NETFLIX */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500 text-xs font-bold">Caricamento...</div>
                ) : events.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center my-8">
                        <h3 className="text-base font-bold text-slate-300 mb-1">Nessun evento</h3>
                        <button
                            onClick={handleOpenCreateModal}
                            className="mt-4 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                        >
                            + Aggiungi Primo Evento
                        </button>
                    </div>
                ) : (
                    <div className="relative my-8 group/carousel">
                        {/* FRECCIA SINISTRA */}
                        <div
                            onMouseEnter={() => startHoverScroll('left')}
                            onMouseLeave={stopHoverScroll}
                            className="absolute left-0 top-0 bottom-0 z-30 w-16 flex items-center justify-start opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer"
                        >
                            <span className="text-white text-6xl font-extralight font-sans drop-shadow-lg hover:scale-125 transition-transform duration-200 select-none pl-2">
                                ‹
                            </span>
                        </div>

                        {/* FRECCIA DESTRA */}
                        <div
                            onMouseEnter={() => startHoverScroll('right')}
                            onMouseLeave={stopHoverScroll}
                            className="absolute right-0 top-0 bottom-0 z-30 w-16 flex items-center justify-end opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer"
                        >
                            <span className="text-white text-6xl font-extralight font-sans drop-shadow-lg hover:scale-125 transition-transform duration-200 select-none pr-2">
                                ›
                            </span>
                        </div>

                        {/* CONTENITORE EVENTI */}
                        <div
                            ref={scrollContainerRef}
                            className="overflow-x-auto py-12 px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <div className="relative flex items-center min-w-max gap-12 before:absolute before:h-1 before:w-full before:bg-emerald-500/40 before:top-1/2 before:-translate-y-1/2 before:z-0">
                                {events.map((evt, idx) => (
                                    <div
                                        key={evt.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative z-10 flex flex-col items-center w-64 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-1 ${draggedIndex === idx ? 'opacity-40' : ''
                                            }`}
                                    >
                                        <span className="mb-3 text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                                            {evt.date_display}
                                        </span>

                                        <div
                                            onClick={() => handleOpenEditModal(evt)}
                                            className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white cursor-pointer hover:scale-125 transition-transform shadow-lg"
                                        />

                                        <div
                                            onClick={() => handleOpenEditModal(evt)}
                                            className="mt-4 bg-slate-800 border border-slate-700 rounded-2xl p-4 w-full cursor-pointer hover:border-emerald-500 transition shadow-xl flex flex-col justify-between"
                                        >
                                            <div>
                                                {evt.media_url && (
                                                    <img
                                                        src={evt.media_url}
                                                        alt={evt.title}
                                                        className="w-full h-28 object-cover rounded-xl mb-3 border border-slate-700"
                                                    />
                                                )}
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-white">{evt.title}</h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteEvent(evt.id);
                                                        }}
                                                        className="text-slate-500 hover:text-red-400 text-xs transition cursor-pointer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                {evt.description && (
                                                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{evt.description}</p>
                                                )}
                                            </div>

                                            {evt.attachment_url && (
                                                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold truncate">
                                                    <span>📎</span>
                                                    <span className="truncate">{evt.attachment_name || 'Allegato'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* PRESENTAZIONE LIM */}
                {isPresenting && (
                    <PresentationModal
                        events={events}
                        activeTimeline={activeTimeline}
                        onClose={() => setIsPresenting(false)}
                    />
                )}
            </div>
        </div>
    );
}