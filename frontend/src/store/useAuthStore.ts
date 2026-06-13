import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  // False until the app-boot gate has validated the persisted session against
  // the server (or confirmed there isn't one). Not persisted — always starts
  // false on a fresh load so protected routes wait for verification instead of
  // flashing with a possibly-expired token.
  hasVerified: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  markVerified: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasVerified: false,
      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true, hasVerified: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false, hasVerified: true }),
      markVerified: () => set({ hasVerified: true }),
    }),
    {
      name: 'auth-storage',
      // Persist only the real data; derive isAuthenticated from token presence
      // on rehydrate so a stale persisted `true` can't pre-authorize routes.
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isAuthenticated = !!state.accessToken;
      },
    }
  )
);
