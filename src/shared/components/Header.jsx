import React from 'react';
import { supabase } from '../services/supabaseClient';

export default function Header({ currentUser, onLogout, userEmail }) {
  const emailToDisplay = currentUser?.email || userEmail;

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      supabase.auth.signOut();
    }
  };

  return (
    <header className="border-b bg-white px-4 py-2.5 flex justify-between items-center shadow-sm rounded-xl mb-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow">
          DS
        </div>
        <h1 className="font-black text-sm text-slate-900">Doceo Suite</h1>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-500 font-medium">{emailToDisplay}</span>
        <button 
          onClick={handleSignOut} 
          className="border px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-700 font-semibold transition"
        >
          🚪 Esci
        </button>
      </div>
    </header>
  );
}