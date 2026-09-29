import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabaseClient';

export default function DilemmaPresentationModal({ activeDilemma, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [choices, setChoices] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const fetchPresentationData = async () => {
      const { data: nodesData } = await supabase
        .from('dilemma_nodes')
        .select('*')
        .eq('dilemma_id', activeDilemma.id);

      setNodes(nodesData || []);

      if (nodesData && nodesData.length > 0) {
        const root = nodesData.find(n => n.is_root) || nodesData[0];
        setCurrentNode(root);

        const nodeIds = nodesData.map(n => n.id);
        const { data: choicesData } = await supabase
          .from('dilemma_choices')
          .select('*')
          .in('node_id', nodeIds);

        setChoices(choicesData || []);
      }
    };

    fetchPresentationData();
  }, [activeDilemma.id]);

  const handleSelectChoice = (choice) => {
    setHistory([...history, { node: currentNode, choice }]);
    if (choice.next_node_id) {
      const nextNode = nodes.find(n => n.id === choice.next_node_id);
      if (nextNode) setCurrentNode(nextNode);
    } else {
      setShowSummary(true);
    }
  };

  const currentChoices = choices.filter(c => c.node_id === currentNode?.id);
  const isFinalNode = currentNode && currentChoices.length === 0;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-50 flex flex-col justify-between p-8 font-sans overflow-y-auto">
      {/* HEADER LIM */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{activeDilemma.icon || '🔀'}</span>
          <div>
            <h1 className="text-xl font-black text-purple-400">{activeDilemma.title}</h1>
            <p className="text-xs text-slate-400">Modalità Proiezione LIM</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
        >
          ✕ Chiudi Presentazione
        </button>
      </div>

      {/* CORPO PRINCIPALE */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6">
        {!showSummary && currentNode ? (
          <div className="space-y-8 text-center">
            
            {/* BADGE STATO NODO (SPECIALE PER IL FINALE) */}
            {isFinalNode ? (
              <div className="inline-block relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-full blur opacity-75 animate-pulse"></div>
                <span className="relative bg-slate-900 text-amber-300 border border-amber-500/50 text-xs sm:text-sm font-black px-6 py-2 rounded-full uppercase tracking-widest inline-flex items-center gap-2 shadow-2xl">
                  <span>🏁</span>
                  <span>FINALE RAGGIUNTO</span>
                  <span>🏁</span>
                </span>
              </div>
            ) : (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider">
                {currentNode.title}
              </span>
            )}

            {/* TESTO SCENARIO: GRAFICA DIFFERENZIATA PER NODO NORMALE VS NODO FINALE */}
            {isFinalNode ? (
              <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-red-950/30 border-2 border-red-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl max-w-3xl mx-auto relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500"></div>
                
                <span className="text-[11px] font-black uppercase tracking-widest text-red-400/90 mb-3 block">
                  📜 Esito Conclusivo della Storia
                </span>
                
                <h3 className="text-xl sm:text-2xl font-black text-amber-200 mb-4">
                  {currentNode.title}
                </h3>
                
                <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
                  {currentNode.content}
                </p>
              </div>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-slate-100 leading-relaxed max-w-3xl mx-auto">
                {currentNode.content}
              </p>
            )}

            {/* BIVI DI SCELTA OPPURE PULSANTI DI COMPLETAMENTO */}
            {!isFinalNode ? (
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {currentChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice)}
                    className="bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-400 p-6 rounded-2xl text-left transition transform hover:-translate-y-1 shadow-xl group cursor-pointer"
                  >
                    <div className="text-sm font-black text-white group-hover:text-white mb-1">
                      👉 {choice.text}
                    </div>
                    {choice.feedback && (
                      <div className="text-xs text-slate-400 group-hover:text-purple-200">
                        {choice.feedback}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* PULSANTI MOSTRATI SOLO QUANDO SI È NEL NODO FINALE */
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setShowSummary(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-8 py-4 rounded-2xl text-sm transition shadow-2xl hover:scale-105 cursor-pointer flex items-center gap-2 border border-purple-400/30"
                >
                  <span>🧠</span>
                  <span>Analizza Esito e Debriefing</span>
                </button>
                <button
                  onClick={() => {
                    setHistory([]);
                    setCurrentNode(nodes.find(n => n.is_root) || nodes[0]);
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-6 py-4 rounded-2xl text-sm transition cursor-pointer"
                >
                  🔄 Ricomincia Percorso
                </button>
              </div>
            )}
          </div>
        ) : (
          /* SCHERMATA FINALE: DEBRIEFING DIDATTICO */
          <div className="space-y-6 my-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🧠</div>
              <h2 className="text-2xl font-black text-white">Debriefing & Analisi delle Scelte</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Ripercorriamo la catena di decisioni che ha condotto la classe all'esito finale.
              </p>
            </div>

            {/* 1. ESITO FINALE RAGGIUNTO */}
            {currentNode && (
              <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-5 text-left max-w-2xl mx-auto shadow-xl">
                <span className="text-[10px] bg-purple-500/30 text-purple-300 font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">
                  📌 Esito Finale Raggiunto
                </span>
                <h3 className="text-base font-black text-white mb-1.5">{currentNode.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{currentNode.content}</p>
              </div>
            )}

            {/* 2. CRONOLOGIA SCELTE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left max-w-2xl mx-auto space-y-3 shadow-2xl">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                📋 Cronologia del Percorso Decisionale:
              </h4>
              {history.map((h, idx) => (
                <div key={idx} className="border-b border-slate-800/80 pb-2.5 text-xs last:border-b-0">
                  <span className="text-purple-400 font-bold">{idx + 1}. {h.node.title}:</span>
                  <div className="text-slate-200 font-semibold mt-0.5">👉 Scelta: {h.choice.text}</div>
                  {h.choice.feedback && (
                    <div className="text-[11px] text-slate-400 italic mt-0.5">{h.choice.feedback}</div>
                  )}
                </div>
              ))}
            </div>

            {/* 3. DOMANDA DI RILANCIO DIDATTICO PER LA CLASSE */}
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 text-left max-w-2xl mx-auto shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Domanda per il Debate & la Discussione in Classe
                </h4>
              </div>
              <p className="text-xs text-amber-100 font-medium leading-relaxed">
                "Quale scelta lungo il percorso ritenete sia stata il vero punto di svolta per giungere a questo esito? Se poteste tornare indietro e cambiare una sola decisione, quale modifichereste e quali conseguenze vi aspettereste?"
              </p>
            </div>

            {/* PULSANTI AZIONE */}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowSummary(false);
                  setHistory([]);
                  setCurrentNode(nodes.find(n => n.is_root) || nodes[0]);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Ricomincia da Capo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="text-center text-[11px] text-slate-500 border-t border-slate-800 pt-3 shrink-0">
        Doceo Dilemma — Strumento per il Debate e il Pensiero Critico
      </div>
    </div>
  );
}