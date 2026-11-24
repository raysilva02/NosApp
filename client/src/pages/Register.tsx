import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, setToken } from '../api/client';
import { useAuth } from '../store/useAuth';
import { registrarPush } from '../hooks/usePush';
import type { AuthResponse, TipoUsuario } from '../api/types';

export function Register() {
  const navigate = useNavigate();
  const setMe = useAuth((s) => s.setMe);
  const [params] = useSearchParams();
  const tipo: TipoUsuario = params.get('tipo') === 'cuidador' ? 'Cuidador' : 'Idoso';
  const isIdoso = tipo === 'Idoso';

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    try {
      const r = await api<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { nomeCompleto: nome, telefone, senha, tipoUsuario: tipo },
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
        <h1 className="brand-title">{isIdoso ? 'Cadastro de Idoso' : 'Cadastro de Cuidador'}</h1>
        <p className="brand-subtitle">
          {isIdoso ? 'Crie sua conta de idoso' : 'Crie sua conta de cuidador'}
        </p>

        {erro && <div className="error-box">{erro}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirmar">Confirmar senha</label>
            <input
              id="confirmar"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            Cadastrar
          </button>
        </form>

        <div className="center" style={{ marginTop: '1.25rem' }}>
          <Link className="btn btn-light btn-block" to="/login">
            Já tenho conta — entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
