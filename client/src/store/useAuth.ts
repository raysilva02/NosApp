import { create } from 'zustand';
import type { Me } from '../api/types';

interface AuthState {
  me: Me | null;
  setMe: (me: Me | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  me: null,
  setMe: (me) => set({ me }),
}));
