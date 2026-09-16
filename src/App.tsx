import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Services & Shared
import { supabase } from './shared/services/supabaseClient';

// Pages
import SuiteHub from './pages/SuiteHub';
import Login from './pages/Login';

// Apps
import KanbanDashboard from './apps/kanban/components/KanbanDashboard';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 font-bold text-sm">Caricamento Doceo Suite...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/dashboard" replace />}
        />

        {/* SUITE HUB (DASHBOARD PRINCIPALE SUITE) */}
        <Route
          path="/dashboard"
          element={
            session ? (
              <SuiteHub currentUser={session.user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* DOCEO KANBAN (APP DEDICATA) */}
        <Route
          path="/apps/kanban"
          element={
            session ? (
              <KanbanDashboard currentUser={session.user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* FUTURA NUOVA APP (Es. Quiz) */}
        {/* 
        <Route
          path="/apps/quiz"
          element={
            session ? (
              <QuizDashboard currentUser={session.user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        /> 
        */}

        {/* REDIRECT PREDEFINITO */}
        <Route
          path="*"
          element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}