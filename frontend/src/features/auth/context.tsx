"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { saveAuthTokens, loadAuthTokens, clearAuthTokens } from '../../shared/lib/auth';
import type { AuthTokens, User, UserRole } from './types';
import { AppPage, PUBLIC_PAGES, PAGE_ACCESS } from './routes';
import { MOCK_USERS } from './mockData';
import { apiClient } from '../../shared/lib/api';
import { loginRequest } from './services/api';

const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';
const LOG_PREFIX = '[AuthContext]';

type AuthContextValue = {
  user: User | null;
  tokens: AuthTokens | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthorized: (page: AppPage, roleOverride?: UserRole | null) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => (USE_API ? loadAuthTokens() : null));
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(USE_API);
  const isHydratingRef = useRef(false);

  const isAuthorized = useCallback(
    (page: AppPage, roleOverride?: UserRole | null) => {
      if (PUBLIC_PAGES.includes(page)) {
        return true;
      }
      const role = roleOverride ?? user?.role ?? null;
      if (!role) {
        return false;
      }
      const allowedRoles = PAGE_ACCESS[page];
      if (!allowedRoles) {
        return true;
      }
      return allowedRoles.includes(role);
    },
    [user?.role]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSessionExpired = () => {
      console.warn(LOG_PREFIX, 'Session expired; redirecting to login');
      clearAuthTokens();
      setTokens(null);
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  useEffect(() => {
    if (!USE_API) {
      setIsBootstrapping(false);
      return;
    }
    let cancelled = false;
    const hydrateUser = async () => {
      if (isHydratingRef.current) return;
      isHydratingRef.current = true;
      const stored = tokens ?? loadAuthTokens();
      if (!stored) {
        setIsBootstrapping(false);
        isHydratingRef.current = false;
        return;
      }
      if (!tokens) {
        setTokens(stored);
      }
      setIsBootstrapping(true);
      try {
        const currentUser = await apiClient.get<User>('/api/v1/auth/me');
        if (cancelled) return;
        setUser(currentUser);
      } catch (error) {
        if (cancelled) return;
        clearAuthTokens();
        setTokens(null);
        setUser(null);
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
        isHydratingRef.current = false;
      }
    };

    hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [tokens]);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    if (USE_API) {
      try {
        const response = await loginRequest(email, password);
        const nextTokens: AuthTokens = {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: Date.now() + response.expires_in * 1000,
        };
        saveAuthTokens(nextTokens);
        setTokens(nextTokens);
        setUser(response.user);
        return response.user;
      } catch (error) {
        throw error;
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!foundUser || password !== 'password' || foundUser.disabled) {
      return null;
    }
    setUser(foundUser);
    return foundUser;
  }, []);

  const logout = useCallback(async () => {
    if (USE_API) {
      const refreshToken = tokens?.refreshToken;
      if (refreshToken) {
        try {
          await apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken });
        } catch (error) {
          console.warn(LOG_PREFIX, 'Logout API call failed', error);
        }
      }
      clearAuthTokens();
      setTokens(null);
    }
    setUser(null);
  }, [tokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isBootstrapping,
        login,
        logout,
        isAuthorized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
