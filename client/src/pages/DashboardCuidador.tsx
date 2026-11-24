import { Link } from 'react-router-dom';
import type { DashboardCuidador } from '../api/types';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';

export function DashboardCuidadorView({ data }: { data: DashboardCuidador }) {
  return (
    <Screen>
      <div className="hero" style={{ background: 'linear-gradient(135deg, var(--accent-dark) 0%, #bf360c 100%)' }}>
        <h2>Olá, {data.me.nomeCompleto} 💛</h2>
        <p>Gerencie seus pacientes e seus remédios.</p>
      </div>

      <div className="stack" style={{ marginBottom: '1.25rem' }}>
        <Link className="btn btn-primary btn-block" to="/pacientes">
          ➕ Adicionar paciente
        </Link>
      </div>

      <div className="section">
        <div className="section-header">👴 Meus pacientes</div>
        <div className="section-body stack">
          {data.pacientes.length === 0 && (
            <EmptyState emoji="👴" text="Nenhum paciente. Adicione pelo telefone." />
          )}
          {data.pacientes.map((p) => (
            <div key={p.relacionamentoId} className="card">
              <div className="card-row">
                <div className="avatar">{p.nomeCompleto.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div className="bold">{p.nomeCompleto}</div>
                  <div className="muted small">{p.telefone}</div>
                </div>
              </div>
              <div className="small muted">Remédios: {p.remedios.length}</div>
              <Link className="btn btn-primary btn-block" to={`/chat/${p.relacionamentoId}`}>
                💬 Conversar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
