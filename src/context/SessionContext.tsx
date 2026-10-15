/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Production-Grade Supabase Session Context for Cymatic Discipline OS
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { LocalUserSession, SessionContextType } from '../types/session';
import { authService } from '../utils/authService';

const SESSION_STORAGE_KEY = 'cymatic_session_v2';

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  uid: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  setOnboardingComplete: () => {},
  updateProfile: async () => {},
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<LocalUserSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Syncs DB role, tier, and profile from Supabase tables with auto-provisioning
  const syncWithSupabase = useCallback(async (uid: string, email: string, currentMoniker?: string) => {
    try {
      let { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (!dbUser) {
        const { data: insertedUser } = await supabase
          .from('users')
          .insert([{ uid, email, moniker: currentMoniker || 'Discipline Champion', role: 'student', created_at: new Date().toISOString() }])
          .select('*')
          .maybeSingle();
        dbUser = insertedUser;
      }

      const { data: dbLicense } = await supabase
        .from('licenses')
        .select('*')
        .eq('owner_uid', uid)
        .maybeSingle();

      const finalMoniker = dbUser?.moniker || currentMoniker || 'Discipline Champion';
      const finalRole = dbUser?.role || 'student';
      const finalTier = dbLicense?.tier || 'Individual';
      const isReseller = dbUser?.role === 'reseller' || dbLicense?.tier === 'Reseller Pro';

      setSession((prev) => {
        if (!prev) return null;
        const updated: LocalUserSession = {
          ...prev,
          moniker: finalMoniker,
          role: finalRole,
          tier: finalTier,
          isReseller,
        };
        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } catch (err) {
      console.warn('[SessionContext] Background sync warning:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (authSession?.user && isMounted) {
          const authUser = authSession.user;
          const userUid = authUser.id;
          const userEmail = authUser.email || '';

          const restoredSession: LocalUserSession = {
            uid: userUid,
            email: userEmail,
            moniker: authUser.user_metadata?.moniker || 'Discipline Champion',
            role: authUser.user_metadata?.role || 'student',
            tier: 'Individual',
            signedInAt: Date.now(),
            lastActiveAt: Date.now(),
            isOnboardingComplete: true,
          };

          setUser(authUser);
          setSession(restoredSession);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredSession));
          syncWithSupabase(userUid, userEmail, restoredSession.moniker);
        } else {
          const cachedRaw = localStorage.getItem(SESSION_STORAGE_KEY);
          if (cachedRaw && isMounted) {
            try {
              const cached: LocalUserSession = JSON.parse(cachedRaw);
              if (cached && cached.uid && cached.email) {
                setSession(cached);
              }
            } catch (e) {
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.error('[SessionContext] Init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newAuthSession) => {
      if (!isMounted) return;
      
      if (newAuthSession?.user) {
        const authUser = newAuthSession.user;
        const restoredSession: LocalUserSession = {
          uid: authUser.id,
          email: authUser.email || '',
          moniker: authUser.user_metadata?.moniker || 'Discipline Champion',
          role: authUser.user_metadata?.role || 'student',
          tier: 'Individual',
          signedInAt: Date.now(),
          lastActiveAt: Date.now(),
          isOnboardingComplete: true,
        };
        setUser(authUser);
        setSession(restoredSession);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredSession));
        syncWithSupabase(authUser.id, authUser.email || '', restoredSession.moniker);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncWithSupabase]);

  const signIn = async (
    email: string,
    moniker: string = 'Discipline Champion',
    role: string = 'student',
    password?: string
  ) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      const finalMoniker = moniker.trim() || 'Discipline Champion';
      const finalRole = role || 'student';
      const pwd = password || 'cymatic123';

      // 1. Check if Supabase session is already present
      const { data: { session: currentAuthSession } } = await supabase.auth.getSession();
      let authUser = currentAuthSession?.user;

      if (!authUser || authUser.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
        const res = await authService.signInWithEmail(cleanEmail, pwd);
        if (res.success && res.user) {
          authUser = res.user;
        } else {
          const signUpRes = await authService.signUpWithEmail(cleanEmail, pwd, finalMoniker, finalRole);
          if (signUpRes.success && signUpRes.user) {
            authUser = signUpRes.user;
          }
        }
      }

      const userUid = authUser?.id || (
        'usr_' + Math.abs(cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(36)
      );

      const userSession: LocalUserSession = {
        uid: userUid,
        email: authUser?.email || cleanEmail,
        moniker: authUser?.user_metadata?.moniker || finalMoniker,
        role: authUser?.user_metadata?.role || finalRole,
        tier: 'Individual',
        signedInAt: Date.now(),
        lastActiveAt: Date.now(),
        isOnboardingComplete: true,
      };

      if (authUser) {
        setUser(authUser);
      }
      setSession(userSession);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));
      } catch {}

      // Asynchronously sync with Supabase tables
      syncWithSupabase(userUid, cleanEmail, finalMoniker);
    } catch (err) {
      console.warn('[SessionContext] Fallback login engaged:', err);
      const cleanEmail = email.trim();
      const fallbackUid = 'usr_' + Math.abs(cleanEmail.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)).toString(36);
      const fallbackSession: LocalUserSession = {
        uid: fallbackUid,
        email: cleanEmail,
        moniker: moniker || 'Discipline Champion',
        role: role || 'student',
        tier: 'Individual',
        signedInAt: Date.now(),
        lastActiveAt: Date.now(),
        isOnboardingComplete: true,
      };
      setSession(fallbackSession);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setUser(null);
  };

  const setOnboardingComplete = (completed: boolean) => {
    setSession((prev) => {
      if (!prev) return null;
      const updated = { ...prev, isOnboardingComplete: completed };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateProfile = async (updates: Partial<LocalUserSession>) => {
    setSession((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (session?.uid && (updates.moniker || updates.role)) {
      try {
        await supabase
          .from('users')
          .update({
            moniker: updates.moniker ?? session.moniker,
            role: updates.role ? String(updates.role).toLowerCase() : undefined,
          })
          .eq('uid', session.uid);
      } catch (err) {
        console.warn('[SessionContext] Profile update DB warning:', err);
      }
    }
  };

  const contextValue: SessionContextType = {
    session,
    user,
    uid: session?.uid ?? user?.id ?? null,
    loading,
    signIn,
    signOut,
    setOnboardingComplete,
    updateProfile,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
