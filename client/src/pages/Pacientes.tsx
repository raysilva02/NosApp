import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Paciente } from '../api/types';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';

export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[] | null>(null);
  const [tel, setTel] = useState('');
  const [erro, setErro] = useState('');

  const carregar = () =>
    api<Paciente[]>('/api/pacientes')
      .then(setPacientes)
      .catch((e) => setErro((e as Error).message));

  useEffect(() => {
    carregar();
  }, []);

  const adicionar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/api/pacientes', { method: 'POST', body: { telefonePaciente: tel } });
      setTel('');
      await carregar();
    } catch (ex) {
      setErro((ex as Error).message);
    }
  };

  const removerRemedio = async (id: number) => {
    if (!window.confirm('Remover este remédio?')) return;
    try {
      await api(`/api/remedios/${id}`, { method: 'DELETE' });
      await carregar();
    } catch (ex) {
      setErro((ex as Error).message);
    }
  };

  return (
    <Screen>
      <h1 className="screen-title">👴 Meus pacientes</h1>

      <div className="section">
        <div className="section-header">➕ Adicionar paciente</div>
        <div className="section-body">
          {erro && <div className="error-box">{erro}</div>}
          <form onSubmit={adicionar} className="stack">
            <div className="field">
              <label htmlFor="telPaciente">Telefone do idoso</label>
              <input
                id="telPaciente"
                className="input"
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit">
              Vincular paciente
            </button>
          </form>
        </div>
      </div>

      <div className="stack">
        {pacientes?.map((p) => (
          <div key={p.relacionamentoId} className="card">
            <div className="card-row">
              <div className="avatar">{p.nomeCompleto.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div className="bold">{p.nomeCompleto}</div>
                <div className="muted small">{p.telefone}</div>
              </div>
              <Link className="btn btn-primary btn-sm" to={`/chat/${p.relacionamentoId}`}>
                💬 Conversar
              </Link>
            </div>

            <div>
              {p.remedios.map((r) => (
                <span key={r.id} className="remedio-tag">
                  {r.nome} · {r.horario}{' '}
                  <button
                    onClick={() => removerRemedio(r.id)}
                    aria-label={`Remover ${r.nome}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--primary-dark)',
                      padding: '0.2rem 0.4rem',
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {p.remedios.length === 0 && <span className="muted small">Sem remédios</span>}
            </div>

            <RemedioForm idosoId={p.idosoId} onDone={carregar} />
          </div>
        ))}
        {pacientes && pacientes.length === 0 && (
          <EmptyState emoji="👴" text="Nenhum paciente vinculado." />
        )}
      </div>
    </Screen>
  );
}

function RemedioForm({ idosoId, onDone }: { idosoId: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [horario, setHorario] = useState('');
  const [dose, setDose] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  if (!open) {
    return (
      <button className="btn btn-accent btn-sm" onClick={() => setOpen(true)}>
        💊 Adicionar remédio
      </button>
    );
  }

  const salvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/api/remedios', {
        method: 'POST',
        body: { idosoId, nome, horario, dose, descricao: descricao || null },
      });
      setNome('');
      setHorario('');
      setDose('');
      setDescricao('');
      setOpen(false);
      onDone();
    } catch (ex) {
      setErro((ex as Error).message);
    }
  };

  return (
    <form onSubmit={salvar} className="stack" style={{ marginTop: '0.5rem' }}>
      {erro && <div className="error-box">{erro}</div>}
      <input
        className="input"
        placeholder="Nome do remédio"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <input
          className="input"
          type="time"
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Dose"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          required
        />
      </div>
      <input
        className="input"
        placeholder="Descrição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
          Salvar
        </button>
        <button className="btn btn-light" type="button" onClick={() => setOpen(false)} style={{ flex: 1 }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
