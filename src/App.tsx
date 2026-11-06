import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Services & Shared
import { supabase } from './shared/services/supabaseClient';
import LandingPage from './shared/components/LandingPage';

// Pages
import SuiteHub from './pages/SuiteHub';
import Login from './pages/Login';

// Apps
import KanbanDashboard from './apps/kanban/components/KanbanDashboard';
import TimelineDashboard from './apps/timeline/components/TimelineDashboard';
import DilemmaDashboard from './apps/dilemma/components/DilemmaDashboard';

// Wrapper per Timeline
function TimelineAppWrapper({ currentUser, onLogout }: { currentUser: any; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <TimelineDashboard
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigateBack={() => navigate('/dashboard')}
    />
  );
}

// Wrapper per Dilemma
function DilemmaAppWrapper({ currentUser, onLogout }: { currentUser: any; onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <DilemmaDashboard
      currentUser={currentUser}
      onLogout={onLogout}
      onNavigateBack={() => navigate('/dashboard')}
    />
  );
}

// Wrapper per i pulsanti della LandingPage
function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGoToLogin={() => navigate('/login')}
      onGoToRegister={() => navigate('/login')}
    />
  );
}

// Componente interno che gestisce le rotte e il redirect del logout
function AppRoutes({ session }: { session: any }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      {/* LANDING PAGE PUBBLICA */}
      <Route
        path="/"
        element={!session ? <LandingPageWrapper /> : <Navigate to="/dashboard" replace />}
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/dashboard" replace />}
      />

      {/* SUITE HUB */}
      <Route
        path="/dashboard"
        element={
          session ? (
            <SuiteHub currentUser={session.user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* DOCEO KANBAN */}
      <Route
        path="/apps/kanban"
        element={
          session ? (
            <KanbanDashboard currentUser={session.user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* DOCEO TIMELINE */}
      <Route
        path="/apps/timeline"
        element={
          session ? (
            <TimelineAppWrapper currentUser={session.user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* DOCEO DILEMMA */}
      <Route
        path="/apps/dilemma"
        element={
          session ? (
            <DilemmaAppWrapper currentUser={session.user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* FALLBACK: Rotte inesistenti rimandano a "/" se non loggato o a "/dashboard" se loggato */}
      <Route
        path="*"
        element={<Navigate to={session ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 font-bold text-sm">Caricamento Doceo Suite...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes session={session} />
    </BrowserRouter>
  );
}