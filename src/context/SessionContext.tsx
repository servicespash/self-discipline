/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Supabase-Powered Session & Institutional User Authentication Engine
 * Includes real-time auth state change listener and automatic role-based session synchronization.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalUserSession, SessionContextType } from '../types/session';
import { recordReferralRedemption } from '../utils/licensing';
import { supabase } from '../utils/supabase';

const STORAGE_KEY = 'sdc_user_session_v1';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<LocalUserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initSession() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: LocalUserSession = JSON.parse(saved);
          setSession(parsed);
          // Verify or sync with Supabase users table
          await supabase.from('users').upsert({
            uid: parsed.uid,
            email: parsed.email,
            moniker: parsed.moniker,
            role: parsed.role.toLowerCase()
          }, { onConflict: 'uid' });
        }
      } catch (e) {
        console.error('[SessionContext] Error initializing session:', e);
      } finally {
        setLoading(false);
      }
    }
    initSession();

    // Setup Supabase auth state change listener for real-time session synchronization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (authSession?.user) {
        const user = authSession.user;
        const email = user.email || 'architect@cymatic.local';
        const moniker = user.user_metadata?.moniker || email.split('@')[0];
        const role = (user.user_metadata?.role || 'user') as any;
        const uid = `usr_${user.id.replace(/-/g, '').slice(0, 16)}`;
        
        const now = Date.now();
        const activeSession: LocalUserSession = {
          uid,
          email,
          moniker,
          role: role.charAt(0).toUpperCase() + role.slice(1),
          tier: 'free',
          signedInAt: now,
          lastActiveAt: now,
          isOnboardingComplete: true
        };
        setSession(activeSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));

        await supabase.from('users').upsert({
          uid,
          email,
          moniker,
          role: role.toLowerCase(),
          tier: 'free'
        }, { onConflict: 'uid' });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, moniker: string, role: 'User' | 'Student' | 'Guardian' | 'Trainer' | 'Administrator') => {
    const cleanEmail = email.trim().toLowerCase();
    const formattedMoniker = moniker.trim() || cleanEmail.split('@')[0] || 'Architect';
    const now = Date.now();
    // Deterministic UID derived from institutional email to ensure persistent ownership in database
    const emailHash = btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const deterministicUid = `usr_${emailHash}`;

    // Record referral redemption against originating user in database if incoming referral is pending
    const redemptionResult = await recordReferralRedemption(deterministicUid, cleanEmail, formattedMoniker);

    // Sync/upsert user record to Supabase database table
    try {
      await supabase.from('users').upsert({
        uid: deterministicUid,
        email: cleanEmail,
        moniker: formattedMoniker,
        role: role.toLowerCase()
      }, { onConflict: 'uid' });
    } catch (err) {
      console.warn('[SessionContext] Supabase user upsert warning:', err);
    }

    const newSession: LocalUserSession = {
      uid: deterministicUid,
      email: cleanEmail,
      moniker: formattedMoniker,
      role: role,
      tier: 'free',
      signedInAt: now,
      lastActiveAt: now,
      referredBy: redemptionResult.redeemed ? redemptionResult.referralCode : undefined,
      referrerMoniker: redemptionResult.redeemed ? redemptionResult.ownerMoniker : undefined
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
      localStorage.removeItem('sdc_locked_spiritual_tradition');
    } catch (e) {
      console.error('[SessionContext] Failed to purge session:', e);
    }
  };

  const setOnboardingComplete = (completed: boolean) => {
    if (!session) return;
    const updatedSession = { ...session, isOnboardingComplete: completed };
    setSession(updatedSession);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (e) {
      console.error('[SessionContext] Failed to save session:', e);
    }
  };

  return (
    <SessionContext.Provider value={{ session, loading, signIn, signOut, setOnboardingComplete }}>
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
