// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
import { User } from '@supabase/supabase-js';

export interface LocalUserSession {
  uid: string;
  email: string;
  moniker: string;
  role: 'User' | 'Student' | 'Guardian' | 'Trainer' | 'Administrator' | 'admin' | 'reseller' | string;
  tier: 'free' | 'pro' | 'enterprise' | 'Team' | 'Reseller Pro' | 'Individual' | string;
  signedInAt: number;
  lastActiveAt: number;
  isOnboardingComplete?: boolean;
  referredBy?: string;
  referrerMoniker?: string;
  isReseller?: boolean;
}

export interface SessionContextType {
  session: LocalUserSession | null;
  user: User | null;
  uid: string | null;
  loading: boolean;
  signIn: (email: string, moniker?: string, role?: string) => Promise<void> | void;
  signOut: () => Promise<void> | void;
  setOnboardingComplete: (completed: boolean) => void;
  updateProfile: (updates: Partial<LocalUserSession>) => Promise<void> | void;
}
