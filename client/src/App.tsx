import { useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import { loadMe } from './api/client';
import { registerSw, registrarPush } from './hooks/usePush';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';
import { Remedios } from './pages/Remedios';
import { Pacientes } from './pages/Pacientes';

function RequireAuth({ children }: { children: ReactNode }) {
  const me = useAuth((s) => s.me);
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const me = useAuth((s) => s.me);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadMe();
      registerSw();
      setReady(true);
    })();
  }, []);

  // Ao autenticar, tenta assinar as notificações push.
  useEffect(() => {
    if (me) registrarPush();
  }, [me]);

  if (!ready) return <div className="loading">Carregando…</div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/chat/:relId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/remedios" element={<RequireAuth><Remedios /></RequireAuth>} />
        <Route path="/pacientes" element={<RequireAuth><Pacientes /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
