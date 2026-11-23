import { Link } from 'react-router-dom';
import type { DashboardIdoso } from '../api/types';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';
import { VoiceButton } from '../components/VoiceButton';

export function DashboardIdosoView({ data }: { data: DashboardIdoso }) {
  return (
    <Screen>
      <div className="hero">
        <h2>Olá, {data.me.nomeCompleto} 💛</h2>
        <p>Aqui você vê seus cuidadores e seus remédios.</p>
      </div>

      <div className="section">
        <div className="section-header">👩‍⚕️ Meus cuidadores</div>
        <div className="section-body stack">
          {data.cuidadores.length === 0 && (
            <EmptyState emoji="👩‍⚕️" text="Nenhum cuidador vinculado ainda." />
          )}
          {data.cuidadores.map((c) => (
            <div key={c.relacionamentoId} className="card">
              <div className="card-row">
                <div className="avatar">{c.nomeCompleto.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div className="bold">{c.nomeCompleto}</div>
                  <div className="muted small">Cuidador(a)</div>
                </div>
              </div>
              <Link className="btn btn-primary btn-block" to={`/chat/${c.relacionamentoId}`}>
                💬 Conversar
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header accent">💊 Meus remédios</div>
        <div className="section-body stack">
          {data.remedios.length === 0 && (
            <EmptyState emoji="💊" text="Nenhum remédio cadastrado." />
          )}
          {data.remedios.map((r) => (
            <div key={r.id} className="remedio-card">
              <span className="badge-horario">🕐 {r.horario}</span>
              <div className="remedio-nome">{r.nome}</div>
              <div className="remedio-dose">{r.dose}</div>
              {r.descricao && <div className="remedio-desc">{r.descricao}</div>}
              <VoiceButton texto={`${r.nome}, dose ${r.dose}, às ${r.horario}`} />
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
