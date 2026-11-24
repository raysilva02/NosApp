import { api, isNetworkError } from '../api/client';
import { enviarAudio } from './audio';
import { listarFila, removerDaFila } from './store';

/**
 * Envia as mensagens pendentes da fila. Para cada uma:
 * - se tem áudio local ainda não subido, faz upload primeiro;
 * - envia via POST; em sucesso, remove da fila.
 * Para no primeiro erro de rede (não há por que insistir offline).
 */
export async function flushFila(): Promise<void> {
  const fila = await listarFila();
  for (const m of fila) {
    try {
      let audioUrl = m.audioUrl;
      if (m.audioLocalUri) {
        const url = await enviarAudio(m.audioLocalUri);
        if (!url) return; // sem rede para o upload — tenta na próxima
        audioUrl = url;
      }
      await api(`/api/chat/${m.relId}/mensagens`, {
        method: 'POST',
        body: { conteudo: m.conteudo ?? '', audioUrl },
      });
      await removerDaFila(m.id);
    } catch (e) {
      if (isNetworkError(e)) return; // offline — interrompe esta rodada
      // Erro definitivo da API (ex.: relacionamento removido): descarta para
      // não travar a fila.
      await removerDaFila(m.id);
    }
  }
}

// Evita reentrância: o flush pode ser disparado por vários gatilhos.
let flushing = false;
export async function maybeFlush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    await flushFila();
  } finally {
    flushing = false;
  }
}
