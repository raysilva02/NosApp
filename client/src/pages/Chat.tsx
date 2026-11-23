import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../store/useAuth';
import { useChat } from '../hooks/useChat';
import { falar, escutar, sttSuportado } from '../hooks/useVoice';
import type { Chat as ChatType, Mensagem } from '../api/types';

const QUICK = [
  'Preciso de ajuda!',
  'Estou bem',
  'Venha para casa',
  'Estou com dor',
  'Preciso do remédio',
  'Estou com fome',
  'Obrigado!',
  'Estou com sono',
];

export function Chat() {
  const { relId } = useParams();
  const relIdNum = Number(relId);
  const me = useAuth((s) => s.me);

  const [chat, setChat] = useState<ChatType | null>(null);
  const [erro, setErro] = useState('');
  const [autoTTS, setAutoTTS] = useState(false);
  const [input, setInput] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const onMessage = (m: Mensagem) => {
    setMensagens((prev) => [...prev, m]);
    if (autoTTS && m.remetenteId !== me?.id) falar(m.conteudo);
  };
  const { send } = useChat(relIdNum, onMessage);

  useEffect(() => {
    api<ChatType>(`/api/chat/${relIdNum}`)
      .then((c) => {
        setChat(c);
        setMensagens(c.mensagens);
      })
      .catch((e) => setErro((e as Error).message));
  }, [relIdNum]);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [mensagens]);

  if (erro) {
    return (
      <div className="screen">
        <div className="error-box">{erro}</div>
        <Link className="btn btn-primary btn-block" to="/">Voltar</Link>
      </div>
    );
  }
  if (!chat) return <div className="loading">Carregando…</div>;

  const enviar = (texto?: string) => {
    const v = (texto ?? input).trim();
    if (!v) return;
    setInput('');
    void send(v);
  };

  const ditar = () => {
    escutar((txt, err) => {
      if (txt) {
        setInput(txt);
        falar('Ouvi: ' + txt);
      } else if (err) {
        falar('Não entendi.');
      }
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-shell">
        <div className={`chat-header ${chat.isIdoso ? '' : 'accent'}`}>
          <Link className="back" to="/" aria-label="Voltar">←</Link>
          <div className="avatar" style={{ width: 44, height: 44, fontSize: '1.2rem' }}>
            {chat.outroUsuarioNome.charAt(0)}
          </div>
          <div className="title">
            <div className="name">{chat.outroUsuarioNome}</div>
            <div className="role">{chat.isIdoso ? 'Cuidador(a)' : 'Idoso'}</div>
          </div>
          <button
            className="icon-btn"
            onClick={() => {
              setAutoTTS((v) => !v);
              falar(autoTTS ? 'Leitura de mensagens desativada.' : 'Leitura de mensagens ativada.');
            }}
            aria-label="Ler mensagens em voz alta"
            title="Ler mensagens em voz alta"
          >
            {autoTTS ? '🔊' : '🔇'}
          </button>
        </div>

        <div className="chat-messages" ref={boxRef}>
          {mensagens.map((m) => (
            <div
              key={m.id}
              className={`msg-wrapper ${m.remetenteId === me?.id ? 'msg-right' : 'msg-left'}`}
            >
              <div
                className={`msg-bubble ${m.remetenteId === me?.id ? 'msg-me' : 'msg-other'}`}
                onClick={() => falar(m.conteudo)}
                title="Toque para ouvir"
              >
                {m.conteudo}
                <span className="msg-time">{m.dataHora}</span>
              </div>
            </div>
          ))}
        </div>

        {chat.isIdoso && (
          <div className="quick-msgs">
            <div className="quick-title">Mensagens rápidas</div>
            <div className="quick-grid">
              {QUICK.map((q) => (
                <button key={q} className="quick-btn" onClick={() => enviar(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="chat-input-area"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            enviar();
          }}
        >
          {sttSuportado() && (
            <button type="button" className="icon-btn" onClick={ditar} aria-label="Ditar mensagem" title="Ditar mensagem">
              🎤
            </button>
          )}
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva uma mensagem..."
            autoComplete="off"
            aria-label="Mensagem"
          />
          <button type="submit" className="send-btn" aria-label="Enviar mensagem">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
