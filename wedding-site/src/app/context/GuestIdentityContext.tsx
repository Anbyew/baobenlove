import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { validateSession } from '../lib/auth';

const STORAGE_KEY = 'wedding_identity';

export interface GuestIdentity {
  email: string;
  name: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  language: 'en' | 'zh';
  verifiedAt: string;
  sessionToken?: string;
}

interface GuestIdentityContextValue {
  identity: GuestIdentity | null;
  isValidating: boolean;
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

export function parseName(fullName: string): { title: string; firstName: string; lastName: string } {
  const titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { title: '', firstName: '', lastName: '' };

  let title = '';
  let rest = parts;

  if (titles.includes(parts[0])) {
    title = parts[0];
    rest = parts.slice(1);
  }

  const firstName = rest[0] ?? '';
  const lastName = rest.slice(1).join(' ');
  return { title, firstName, lastName };
}

export function GuestIdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentityState] = useState<GuestIdentity | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (!stored?.sessionToken) {
      setIdentityState(stored);
      setIsValidating(false);
      return;
    }

    validateSession(stored.sessionToken).then((session) => {
      if (session) {
        const refreshed: GuestIdentity = {
          ...stored,
          name: session.name || stored.name,
          language: (session.language as 'en' | 'zh') || stored.language,
        };
        setIdentityState(refreshed);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
      } else {
        setIdentityState(null);
        window.localStorage.removeItem(STORAGE_KEY);
      }
      setIsValidating(false);
    });
  }, []);

  const setIdentity = useCallback((next: GuestIdentity) => {
    setIdentityState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearIdentity = useCallback(() => {
    setIdentityState(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ identity, isValidating, setIdentity, clearIdentity }),
    [identity, isValidating, setIdentity, clearIdentity],
  );

  return <GuestIdentityContext.Provider value={value}>{children}</GuestIdentityContext.Provider>;
}

export function useGuestIdentity() {
  const ctx = useContext(GuestIdentityContext);
  if (!ctx) throw new Error('useGuestIdentity must be used within GuestIdentityProvider');
  return ctx;
}
