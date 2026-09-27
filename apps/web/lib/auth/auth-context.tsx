'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface GuestSession {
  guestId: string;
  guestToken: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  guest: GuestSession | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load session from storage on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = localStorage.getItem('curiosity_access_token');
        const storedGuest = localStorage.getItem('curiosity_guest_session');

        if (storedToken) {
          setAccessToken(storedToken);
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('curiosity_access_token');
            localStorage.removeItem('curiosity_refresh_token');
            setAccessToken(null);
          }
        } else if (storedGuest) {
          const parsedGuest = JSON.parse(storedGuest);
          if (new Date(parsedGuest.expiresAt) > new Date()) {
            setGuest(parsedGuest);
          } else {
            localStorage.removeItem('curiosity_guest_session');
          }
        }
      } catch {
        // Fallback gracefully on storage / network errors
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Invalid email or password');
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    setGuest(null);
    localStorage.setItem('curiosity_access_token', data.accessToken);
    localStorage.setItem('curiosity_refresh_token', data.refreshToken);
    localStorage.removeItem('curiosity_guest_session');
    router.push('/dashboard');
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Failed to register account');
    }

    const data = await res.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
    setGuest(null);
    localStorage.setItem('curiosity_access_token', data.accessToken);
    localStorage.setItem('curiosity_refresh_token', data.refreshToken);
    localStorage.removeItem('curiosity_guest_session');
    router.push('/dashboard');
  };

  const continueAsGuest = async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
    });

    if (!res.ok) {
      throw new Error('Failed to initiate guest session');
    }

    const guestData: GuestSession = await res.json();
    setGuest(guestData);
    setUser(null);
    setAccessToken(null);
    localStorage.setItem('curiosity_guest_session', JSON.stringify(guestData));
    localStorage.removeItem('curiosity_access_token');
    localStorage.removeItem('curiosity_refresh_token');
    router.push('/dashboard');
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('curiosity_refresh_token');
    if (accessToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore network errors on logout
      }
    }

    setUser(null);
    setGuest(null);
    setAccessToken(null);
    localStorage.removeItem('curiosity_access_token');
    localStorage.removeItem('curiosity_refresh_token');
    localStorage.removeItem('curiosity_guest_session');
    router.push('/auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guest,
        accessToken,
        isLoading,
        login,
        register,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
