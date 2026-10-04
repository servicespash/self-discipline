export interface LocalUserSession {
  uid: string;
  email: string;
  moniker: string;
  signedInAt: number;
  lastActiveAt: number;
}

export interface SessionContextType {
  session: LocalUserSession | null;
  loading: boolean;
  signIn: (email: string, moniker?: string) => void;
  signOut: () => void;
}
