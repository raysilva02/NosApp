import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

// Contato disponível para enviar mensagem por voz (cuidador ou paciente).
export interface Contato {
  nome: string;
  relId: number;
}

// Contexto de voz: cada tela registra aqui (1) uma descrição falada para o
// comando "lê pra mim" e (2) dados de ação (telefone do cuidador, remédios,
// contatos) para os comandos "ligar", "remédios de hoje" e "mandar mensagem".
export interface VoiceState {
  descricaoTela: string;
  telefoneCuidador: string | null;
  remediosHoje: string;
  contatos: Contato[];
  registrar: (patch: Partial<Omit<VoiceState, 'registrar'>>) => void;
}

const VoiceContext = createContext<VoiceState | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [descricaoTela, setDescricaoTela] = useState('');
  const [telefoneCuidador, setTelefoneCuidador] = useState<string | null>(null);
  const [remediosHoje, setRemediosHoje] = useState('');
  const [contatos, setContatos] = useState<Contato[]>([]);

  // Referência estável: os setters do useState são estáveis por garantia do
  // React, então useCallback([]) mantém `registrar` o mesmo em todos os
  // renders. Sem isso, qualquer useEffect que dependa de `registrar` entra em
  // loop infinito (setState -> novo registrar -> efeito roda de novo).
  const registrar = useCallback((patch: Partial<Omit<VoiceState, 'registrar'>>) => {
    if (patch.descricaoTela !== undefined) setDescricaoTela(patch.descricaoTela);
    if (patch.telefoneCuidador !== undefined) setTelefoneCuidador(patch.telefoneCuidador);
    if (patch.remediosHoje !== undefined) setRemediosHoje(patch.remediosHoje);
    if (patch.contatos !== undefined) setContatos(patch.contatos);
  }, []);

  const value = useMemo<VoiceState>(
    () => ({
      descricaoTela,
      telefoneCuidador,
      remediosHoje,
      contatos,
      registrar,
    }),
    [descricaoTela, telefoneCuidador, remediosHoje, contatos, registrar]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice(): VoiceState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice deve ser usado dentro de VoiceProvider');
  return ctx;
}
