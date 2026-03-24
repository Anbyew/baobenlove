import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchInviteSession,
  lookupInviteSession,
  type InviteLookupInput,
  type InviteSession,
} from '../lib/invite';

const INVITE_PARAM = 'invite';
const STORAGE_KEY = 'wedding_invite_token';

interface GuestSessionContextValue {
  invite: InviteSession | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  identifyGuest: (input: InviteLookupInput) => Promise<void>;
  refreshInvite: () => Promise<void>;
  clearSession: () => void;
}

const GuestSessionContext = createContext<GuestSessionContextValue | null>(null);

function readInviteTokenFromUrl() {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const invite = url.searchParams.get(INVITE_PARAM)?.trim() ?? null;

  if (!invite) return null;

  url.searchParams.delete(INVITE_PARAM);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);

  return invite;
}

function readStoredInviteToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function persistInviteToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const [invite, setInvite] = useState<InviteSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvite = useCallback(async (nextToken: string | null) => {
    if (!nextToken) {
      setInvite(null);
      setToken(null);
      setError(null);
      setIsLoading(false);
      persistInviteToken(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchInviteSession(nextToken);
      setInvite(response.invite);
      setToken(nextToken);
      persistInviteToken(nextToken);
    } catch (err) {
      setInvite(null);
      setToken(null);
      persistInviteToken(null);
      setError(err instanceof Error ? err.message : 'Unable to open this invitation.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlToken = readInviteTokenFromUrl();
    const storedToken = readStoredInviteToken();
    void loadInvite(urlToken ?? storedToken);
  }, [loadInvite]);

  const identifyGuest = useCallback(
    async (input: InviteLookupInput) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await lookupInviteSession(input);
        setInvite(response.invite);
        setToken(response.invite.token);
        persistInviteToken(response.invite.token);
      } catch (err) {
        setInvite(null);
        setToken(null);
        persistInviteToken(null);
        setError(
          err instanceof Error
            ? err.message
            : 'We could not find your invitation with that information.',
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const refreshInvite = useCallback(async () => {
    await loadInvite(token);
  }, [loadInvite, token]);

  const clearSession = useCallback(() => {
    setInvite(null);
    setToken(null);
    setError(null);
    setIsLoading(false);
    persistInviteToken(null);
  }, []);

  const value = useMemo(
    () => ({
      invite,
      token,
      isLoading,
      error,
      identifyGuest,
      refreshInvite,
      clearSession,
    }),
    [clearSession, error, identifyGuest, invite, isLoading, refreshInvite, token],
  );

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext);
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider');
  return ctx;
}
