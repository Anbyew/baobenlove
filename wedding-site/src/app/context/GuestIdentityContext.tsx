import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'wedding_identity';

export interface GuestIdentity {
  email: string;
  name: string;
  language: 'en' | 'zh';
  verifiedAt: string;
}

interface GuestIdentityContextValue {
  identity: GuestIdentity | null;
  setIdentity: (identity: GuestIdentity) => void;
  clearIdentity: () => void;
}

const GuestIdentityContext = createContext<GuestIdentityContextValue | null>(null);

function readStored(): GuestIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestIdentity) : null;
  } catch {
    return null;
  }
}

export function GuestIdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<GuestIdentity | null>(readStored);

  const setIdentity = useCallback((next: GuestIdentity) => {
    setIdentityState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearIdentity = useCallback(() => {
    setIdentityState(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ identity, setIdentity, clearIdentity }),
    [identity, setIdentity, clearIdentity],
  );

  return <GuestIdentityContext.Provider value={value}>{children}</GuestIdentityContext.Provider>;
}

export function useGuestIdentity() {
  const ctx = useContext(GuestIdentityContext);
  if (!ctx) throw new Error('useGuestIdentity must be used within GuestIdentityProvider');
  return ctx;
}
