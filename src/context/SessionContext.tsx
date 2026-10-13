import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';
import { LocalUserSession, SessionContextType } from '../types/session';
import { recordReferralRedemption, PENDING_REFERRAL_CODE_KEY } from '../utils/licensing';

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

function createSyntheticUser(uid: string, email: string, moniker?: string): User {
  return {
    id: uid,
    email: email,
    app_metadata: {},
    user_metadata: { moniker: moniker || 'Discipline Champion' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as unknown as User;
}

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<LocalUserSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Syncs DB role, tier, and profile from Supabase tables
  const syncWithSupabase = useCallback(async (uid: string, email: string, currentMoniker?: string) => {
    try {
      // 1. Fetch from public.users
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .or(`uid.eq.${uid},email.eq.${email.toLowerCase()}`)
        .maybeSingle();

      // 2. Fetch tier from public.licenses
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
        // 1. Check native Supabase Auth session first
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (authSession?.user && isMounted) {
          const authUser = authSession.user;
          const userUid = authUser.id;
          const userEmail = authUser.email || '';

          const restoredSession: LocalUserSession = {
            uid: userUid,
            email: userEmail,
            moniker: authUser.user_metadata?.moniker || 'Discipline Champion',
            role: 'User',
            tier: 'free',
            signedInAt: Date.now(),
            lastActiveAt: Date.now(),
            isOnboardingComplete: true,
          };

          setUser(authUser);
          setSession(restoredSession);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredSession));
          syncWithSupabase(userUid, userEmail, restoredSession.moniker);
          return;
        }

        // 2. Check cached local workspace session
        const cachedRaw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (cachedRaw && isMounted) {
          try {
            const cached: LocalUserSession = JSON.parse(cachedRaw);
            if (cached && cached.uid && cached.email) {
              setSession(cached);
              setUser(createSyntheticUser(cached.uid, cached.email, cached.moniker));
              syncWithSupabase(cached.uid, cached.email, cached.moniker);
              return;
            }
          } catch (e) {
            console.warn('[SessionContext] Cache parse error:', e);
          }
        }
      } catch (err) {
        console.error('[SessionContext] Init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    // 3. Listen to Supabase Auth state changes live
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newAuthSession) => {
      if (!isMounted) return;
      if (newAuthSession?.user) {
        const authUser = newAuthSession.user;
        const restoredSession: LocalUserSession = {
          uid: authUser.id,
          email: authUser.email || '',
          moniker: authUser.user_metadata?.moniker || 'Discipline Champion',
          role: 'User',
          tier: 'free',
          signedInAt: Date.now(),
          lastActiveAt: Date.now(),
          isOnboardingComplete: true,
        };
        setUser(authUser);
        setSession(restoredSession);
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(restoredSession));
        syncWithSupabase(authUser.id, authUser.email || '', restoredSession.moniker);
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
    role: string = 'User'
  ) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanMoniker = moniker.trim() || 'Discipline Champion';

    try {
      // 1. Check or register user in public.users
      let resolvedUid = '';
      let resolvedRole = role;
      let resolvedTier = 'free';

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        resolvedUid = existingUser.uid;
        resolvedRole = existingUser.role || role;
      } else {
        resolvedUid = crypto.randomUUID();
        try {
          await supabase.from('users').insert({
            uid: resolvedUid,
            email: cleanEmail,
            moniker: cleanMoniker,
            role: resolvedRole.toLowerCase(),
          });
        } catch (dbErr) {
          console.warn('[SessionContext] User registration warning:', dbErr);
        }
      }

      // 2. Fetch real subscription tier / reseller status from public.licenses
      const { data: licenseData } = await supabase
        .from('licenses')
        .select('*')
        .eq('owner_uid', resolvedUid)
        .maybeSingle();

      if (licenseData) {
        resolvedTier = licenseData.tier || 'Team';
      }

      // 3. Check for any pending referral redemption
      let pendingReferralCode: string | undefined = undefined;
      try {
        const pendingRef = localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
        if (pendingRef) {
          pendingReferralCode = pendingRef;
          await recordReferralRedemption(resolvedUid, cleanEmail, cleanMoniker);
        }
      } catch {}

      const newSession: LocalUserSession = {
        uid: resolvedUid,
        email: cleanEmail,
        moniker: cleanMoniker,
        role: resolvedRole,
        tier: resolvedTier,
        signedInAt: Date.now(),
        lastActiveAt: Date.now(),
        isOnboardingComplete: true,
        referredBy: pendingReferralCode,
        isReseller: resolvedRole === 'reseller' || resolvedTier === 'Reseller Pro',
      };

      const syntheticUser = createSyntheticUser(resolvedUid, cleanEmail, cleanMoniker);

      setUser(syntheticUser);
      setSession(newSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    } catch (err) {
      console.error('[SessionContext] signIn error:', err);
      // Resilient local fallback
      const fallbackUid = crypto.randomUUID();
      const fallbackSession: LocalUserSession = {
        uid: fallbackUid,
        email: cleanEmail,
        moniker: cleanMoniker,
        role: role,
        tier: 'free',
        signedInAt: Date.now(),
        lastActiveAt: Date.now(),
        isOnboardingComplete: true,
      };
      setUser(createSyntheticUser(fallbackUid, cleanEmail, cleanMoniker));
      setSession(fallbackSession);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[SessionContext] Supabase signOut note:', e);
    }
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
