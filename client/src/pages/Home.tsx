import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../store/useAuth';
import type { DashboardIdoso, DashboardCuidador } from '../api/types';
import { DashboardIdosoView } from './DashboardIdoso';
import { DashboardCuidadorView } from './DashboardCuidador';

export function Home() {
  const me = useAuth((s) => s.me);
  const [data, setData] = useState<DashboardIdoso | DashboardCuidador | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api<DashboardIdoso | DashboardCuidador>('/api/dashboard')
      .then(setData)
      .catch((e) => setErro((e as Error).message));
  }, []);

  if (erro) return <div className="screen"><div className="error-box">{erro}</div></div>;
  if (!data) return <div className="loading">Carregando…</div>;

  return me?.tipoUsuario === 'Idoso' ? (
    <DashboardIdosoView data={data as DashboardIdoso} />
  ) : (
    <DashboardCuidadorView data={data as DashboardCuidador} />
  );
}
