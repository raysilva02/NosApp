import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// Contexto de voz: cada tela registra aqui (1) uma descrição falada para o
// comando "lê pra mim" e (2) dados de ação (telefone do cuidador, remédios)
// para os comandos "ligar" e "remédios de hoje".
export interface VoiceState {
  descricaoTela: string;
  telefoneCuidador: string | null;
  remediosHoje: string;
  registrar: (patch: Partial<Omit<VoiceState, 'registrar'>>) => void;
}

const VoiceContext = createContext<VoiceState | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [descricaoTela, setDescricaoTela] = useState('');
  const [telefoneCuidador, setTelefoneCuidador] = useState<string | null>(null);
  const [remediosHoje, setRemediosHoje] = useState('');

  const value = useMemo<VoiceState>(
    () => ({
      descricaoTela,
      telefoneCuidador,
      remediosHoje,
      registrar: (patch) => {
        if (patch.descricaoTela !== undefined) setDescricaoTela(patch.descricaoTela);
        if (patch.telefoneCuidador !== undefined) setTelefoneCuidador(patch.telefoneCuidador);
        if (patch.remediosHoje !== undefined) setRemediosHoje(patch.remediosHoje);
      },
    }),
    [descricaoTela, telefoneCuidador, remediosHoje]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice deve ser usado dentro de VoiceProvider');
  return ctx;
}
