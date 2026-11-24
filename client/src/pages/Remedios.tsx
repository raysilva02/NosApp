import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Remedio } from '../api/types';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/EmptyState';
import { VoiceButton } from '../components/VoiceButton';

export function Remedios() {
  const [remedios, setRemedios] = useState<Remedio[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api<Remedio[]>('/api/remedios')
      .then(setRemedios)
      .catch((e) => setErro((e as Error).message));
  }, []);

  return (
    <Screen>
      <h1 className="screen-title">💊 Meus remédios</h1>

      {erro && <div className="error-box">{erro}</div>}

      <div className="stack">
        {remedios?.map((r) => (
          <div key={r.id} className="remedio-card">
            <span className="badge-horario">🕐 {r.horario}</span>
            <div className="remedio-nome">{r.nome}</div>
            <div className="remedio-dose">{r.dose}</div>
            {r.descricao && <div className="remedio-desc">{r.descricao}</div>}
            <VoiceButton texto={`${r.nome}, dose ${r.dose}, às ${r.horario}`} />
          </div>
        ))}
        {remedios && remedios.length === 0 && (
          <EmptyState emoji="💊" text="Nenhum remédio cadastrado." />
        )}
      </div>
    </Screen>
  );
}
