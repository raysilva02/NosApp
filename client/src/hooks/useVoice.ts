/**
 * Voz (TTS/STT) usando a Web Speech API do navegador.
 * Nenhuma dependência externa.
 */

export function falar(texto: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-BR';
  u.rate = 0.95; // levemente mais lento, mais confortável para idosos
  window.speechSynthesis.speak(u);
}

export function pararDeFalar() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function sttSuportado(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export function escutar(callback: (texto: string | null, erro?: string) => void) {
  const w = window as unknown as Record<string, any>;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) {
    callback(null, 'Reconhecimento de voz não suportado.');
    return;
  }

  const rec = new SR();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => callback(e.results[0][0].transcript);
  rec.onerror = (e: any) => callback(null, e.error);
  rec.start();
}
