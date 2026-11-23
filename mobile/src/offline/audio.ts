import { File, Paths, UploadType } from 'expo-file-system';
import { API_URL } from '../api/config';
import { getToken } from '../api/client';

/**
 * Faz o upload do arquivo de áudio e retorna a URL relativa no servidor.
 * Usa a API nativa do expo-file-system (multipart), que lê `file://` direto.
 * Lança NetworkError em falha de rede; retorna null em erro HTTP do servidor.
 */
export async function enviarAudio(uri: string): Promise<string | null> {
  let result;
  try {
    const file = new File(uri);
    const token = getToken();
    result = await file.upload(`${API_URL}/api/upload/audio`, {
      uploadType: UploadType.MULTIPART,
      fieldName: 'arquivo',
      mimeType: 'audio/mp4',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    const err = new Error('Sem conexão para enviar o áudio.');
    err.name = 'NetworkError';
    throw err;
  }

  if (result.status >= 400) return null;
  const j = JSON.parse(result.body);
  return (j as { url: string }).url;
}

/**
 * Resolve uma URL de áudio para uma URI local (cache), permitindo reproduzir
 * offline áudios já ouvidos. Se ainda não está em cache, tenta baixar; se
 * estiver offline, devolve a URL remota como fallback.
 */
export async function localAudioUri(remotePath: string | null): Promise<string | null> {
  if (!remotePath) return null;
  if (remotePath.startsWith('file://')) return remotePath;

  const nome = remotePath.split('/').filter(Boolean).pop() ?? 'audio';
  const file = new File(Paths.cache, nome);
  if (file.exists) return file.uri;

  try {
    await File.downloadFileAsync(`${API_URL}${remotePath}`, file);
    return file.uri;
  } catch {
    return `${API_URL}${remotePath}`;
  }
}
