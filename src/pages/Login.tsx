import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Registrazione completata! Controlla la tua email per confermare.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setMessage(err.message || 'Errore durante l\'autenticazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 text-white font-black text-2xl rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            D
          </div>
          <h1 className="text-2xl font-black text-slate-900">Doceo Suite</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {isSignUp ? 'Crea il tuo account docente' : 'Accedi ai tuoi strumenti didattici'}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-xl text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email docente</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@scuola.it"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Elaborazione...' : isSignUp ? 'Registrati' : 'Accedi alla Suite'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-blue-600 hover:underline font-bold"
          >
            {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}