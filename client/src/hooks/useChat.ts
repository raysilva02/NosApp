import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getToken } from '../api/client';

export interface MensagemRecebida {
  id: number;
  conteudo: string;
  dataHora: string;
  remetenteId: string;
  remetenteNome: string;
}

/**
 * Gerencia a conexão SignalR de um chat. Abre a sala e encaminha
 * mensagens recebidas para `onMessage`.
 */
export function useChat(relId: number, onMessage: (m: MensagemRecebida) => void) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/chatHub', { accessTokenFactory: () => getToken() ?? '' })
      .withAutomaticReconnect()
      .build();

    conn.on('ReceiveMessage', (m: MensagemRecebida) => onMessageRef.current(m));
    conn
      .start()
      .then(() => conn.invoke('JoinRoom', String(relId)))
      .catch(() => {
        /* reconexão automática vai tentar de novo */
      });
    setConnection(conn);

    return () => {
      conn.stop().catch(() => {});
    };
  }, [relId]);

  const send = async (conteudo: string) => {
    const texto = conteudo.trim();
    if (!texto) return;
    if (connection) await connection.invoke('SendMessage', relId, texto);
  };

  return { send };
}
