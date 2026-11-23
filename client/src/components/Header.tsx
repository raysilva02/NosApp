import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { api } from '../api/client';
import { falar, escutar, sttSuportado } from '../hooks/useVoice';

export function Header() {
  const me = useAuth((s) => s.me);
  const setMe = useAuth((s) => s.setMe);
  const navigate = useNavigate();

  const sair = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* mesmo que falhe, encerramos localmente */
    }
    setMe(null);
    navigate('/login');
  };

  const comandoVoz = () => {
    falar('Diga um comando.');
    escutar((txt, err) => {
      if (!txt) {
        if (err) falar('Não entendi.');
        return;
      }
      const t = txt.toLowerCase();
      if (/remedio|remédio/.test(t)) {
        falar('Abrindo remédios.');
        navigate('/remedios');
      } else if (/sair|logout|encerrar/.test(t)) {
        sair();
      } else if (/paciente/.test(t) && me?.tipoUsuario === 'Cuidador') {
        falar('Abrindo pacientes.');
        navigate('/pacientes');
      } else if (/inicio|início|menu|home/.test(t)) {
        falar('Voltando ao início.');
        navigate('/');
      } else {
        falar('Comando não reconhecido.');
      }
    });
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <a className="brand" href="#/">
          Nós
        </a>
        <div className="app-header-actions">
          {sttSuportado() && (
            <button
              className="icon-btn"
              onClick={comandoVoz}
              aria-label="Comando de voz"
              title="Comando de voz"
            >
              <span aria-hidden>🎤</span>
            </button>
          )}
          <span className="user-name">{me?.nomeCompleto ?? ''}</span>
          <button className="btn btn-light btn-sm" onClick={sair}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
