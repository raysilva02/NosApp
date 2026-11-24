import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, isNetworkError, setToken } from '../api/client';
import { registrarPushExpo } from '../notifications';
import { initConnectivity, onConnectivityChange } from '../offline/connectivity';
import { maybeFlush } from '../offline/sync';
import { limparOffline } from '../offline/store';
import type { Me } from '../api/types';

const TOKEN_KEY = 'nos_token';
const ME_KEY = 'nos_me';

interface AuthState {
  me: Me | null;
  ready: boolean;
  online: boolean;
  login: (token: string, me: Me) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [online, setOnlineState] = useState(true);

  useEffect(() => {
    initConnectivity();
    return onConnectivityChange((o) => {
      setOnlineState(o);
      if (o) maybeFlush();
    });
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(TOKEN_KEY);
      if (!saved) {
        setReady(true);
        return;
      }

      // Lê o perfil em cache local primeiro (não dependemos da rede para abrir).
      const cachedMe = await AsyncStorage.getItem(ME_KEY);
      if (cachedMe) {
        try {
          setMe(JSON.parse(cachedMe));
        } catch {
          /* ignora cache corrompido */
        }
      }

      setToken(saved);
      try {
        const user = await api<Me>('/api/auth/me');
        setMe(user);
        await AsyncStorage.setItem(ME_KEY, JSON.stringify(user));
      } catch (e) {
        // Sem rede: mantém a sessão com o perfil em cache. Só desloga se o
        // servidor responder que o token é inválido (401), não por offline.
        if (!isNetworkError(e) && !cachedMe) {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setMe(null);
        }
      }
      setReady(true);
    })();
  }, []);

  // Ao estar autenticado, registra o push e dispara a sincronização da fila.
  useEffect(() => {
    if (me) {
      registrarPushExpo();
      maybeFlush();
    }
  }, [me]);

  const login = async (token: string, user: Me) => {
    setToken(token);
    setMe(user);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(ME_KEY, JSON.stringify(user));
    maybeFlush();
  };

  const logout = async () => {
    setToken(null);
    setMe(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(ME_KEY);
    await limparOffline();
  };

  return (
    <AuthContext.Provider value={{ me, ready, online, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
