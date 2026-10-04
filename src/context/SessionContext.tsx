import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalUserSession, SessionContextType } from '../types/session';

const STORAGE_KEY = 'sdc_user_session_v1';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<LocalUserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: LocalUserSession = JSON.parse(saved);
        setSession(parsed);
      }
    } catch (e) {
      console.error('[SessionContext] Error parsing saved session:', e);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = (email: string, moniker?: string) => {
    const formattedMoniker = moniker?.trim() || email.split('@')[0] || 'User';
    const now = Date.now();
    const newSession: LocalUserSession = {
      uid: `local-${now}`,
      email: email.trim(),
      moniker: formattedMoniker,
      signedInAt: now,
      lastActiveAt: now
    };

    setSession(newSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (e) {
      console.error('[SessionContext] Failed to save session:', e);
    }
  };

  const signOut = () => {
    setSession(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[SessionContext] Failed to purge session:', e);
    }
  };

  return (
    <SessionContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
