import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { useAuth } from '../store/useAuth';
import { registrarPush } from '../hooks/usePush';
import type { AuthResponse } from '../api/types';

export function Login() {
  const navigate = useNavigate();
  const setMe = useAuth((s) => s.setMe);
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    try {
      const r = await api<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { telefone, senha },
      });
      setToken(r.token);
      setMe(r.me);
      registrarPush();
      navigate('/');
    } catch (ex) {
      setErro((ex as Error).message);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="logo-circle" aria-hidden>💛</div>
        <h1 className="brand-title">Nós</h1>
        <p className="brand-subtitle">Cuidado e conexão</p>

        {erro && <div className="error-box">{erro}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            Entrar
          </button>
        </form>

        <div className="center" style={{ marginTop: '1.25rem' }}>
          <p className="muted">Não tem conta?</p>
          <div className="stack" style={{ gap: '0.5rem' }}>
            <Link className="btn btn-outline btn-block" to="/register?tipo=idoso">
              Cadastrar como Idoso
            </Link>
            <Link className="btn btn-outline btn-block" to="/register?tipo=cuidador">
              Cadastrar como Cuidador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
