import { falar } from '../hooks/useVoice';

/**
 * Botão "Ouvir": lê o texto em voz alta (TTS).
 * Sempre com rótulo visível — nunca apenas ícone.
 */
export function VoiceButton({ texto }: { texto: string }) {
  return (
    <button className="voice-btn" onClick={() => falar(texto)}>
      <span aria-hidden>🔊</span> Ouvir
    </button>
  );
}
