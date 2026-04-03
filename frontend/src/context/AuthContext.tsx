'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/services/authService';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  initialising: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initialising, setInitialising] = useState(true);

  // On first mount, try to restore the session from a stored token
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setInitialising(false);
      return;
    }
    authService
      .getProfile()
      .then(setUser)
      .catch(() => authService._clearTokens())
      .finally(() => setInitialising(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authService.login(username, password);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initialising, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
