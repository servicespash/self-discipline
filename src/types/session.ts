export interface LocalUserSession {
  uid: string;
  email: string;
  moniker: string;
  role: 'User' | 'Student' | 'Guardian' | 'Trainer' | 'Administrator';
  tier: 'free' | 'pro' | 'enterprise';
  signedInAt: number;
  lastActiveAt: number;
  isOnboardingComplete?: boolean;
  referredBy?: string;
  referrerMoniker?: string;
}

export interface SessionContextType {
  session: LocalUserSession | null;
  loading: boolean;
  signIn: (email: string, moniker: string, role: 'User' | 'Student' | 'Guardian' | 'Trainer' | 'Administrator') => void;
  signOut: () => void;
  setOnboardingComplete: (completed: boolean) => void;
}
