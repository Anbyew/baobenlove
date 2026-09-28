import { useState } from 'react';
import { EmailAuthGate } from '../../components/EmailAuthGate';
import { AnalyticsTracker } from '../../components/AnalyticsTracker';
import { useGuestIdentity } from '../../context/GuestIdentityContext';
import { BACKDOOR_AUTH_KEY, BACKDOOR_PASSWORD } from '../lib/backdoor';

// The backdoor hub and every owner-only page under it skip the site's guest
// password + RSVP-email login (see App.tsx) and are wrapped in BackdoorGate
// instead: a dedicated password, then the same email-login flow guests use —
// restricted to the owner emails below. Same
// client-side-only mechanism as the rest of the site's gates: a deterrent
// for whoever has the link, not a security boundary.

const ADMIN_EMAILS = new Set([
  'baobaoyuwei@gmail.com',
  'bellabenbao@gmail.com',
  'yuweibao@umich.edu',
  'bkrakoff@gmail.com',
]);

function BackdoorPasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(BACKDOOR_AUTH_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const submit = () => {
    if (input === BACKDOOR_PASSWORD) {
      localStorage.setItem(BACKDOOR_AUTH_KEY, 'true');
      setAuthed(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-xs">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-10" />
        <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-2">baoben.love</p>
        <h1 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Backdoor</h1>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoFocus
          className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-3 text-center font-light text-foreground placeholder:text-foreground/30 outline-none transition-colors mb-4"
        />
        {error && <p className="text-xs text-destructive mb-3">Incorrect password.</p>}
        <button type="button" onClick={submit} className="w-full bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase font-light">
          Enter
        </button>
      </div>
    </div>
  );
}

function NotAuthorized() {
  const { identity, clearIdentity } = useGuestIdentity();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-xs">
        <p className="text-sm font-light text-foreground/70 mb-4">
          {identity?.email} isn't on the owner list for this page.
        </p>
        <button
          type="button"
          onClick={clearIdentity}
          className="text-xs font-light text-foreground/50 hover:text-foreground/80 underline"
        >
          Log in with a different email
        </button>
      </div>
    </div>
  );
}

function OwnerGate({ children }: { children: React.ReactNode }) {
  const { identity } = useGuestIdentity();
  if (!identity) return null;
  if (!ADMIN_EMAILS.has(identity.email)) return <NotAuthorized />;
  return (
    <>
      {/* Logs a page_view event (with this owner's session/email) for every
          page under /backdoor, same mechanism as guest-page analytics — see
          the "Backdoor Activity" tab on the RSVP Dashboard. */}
      <AnalyticsTracker />
      {children}
    </>
  );
}

export function BackdoorGate({ children }: { children: React.ReactNode }) {
  return (
    <BackdoorPasswordGate>
      <EmailAuthGate>
        <OwnerGate>{children}</OwnerGate>
      </EmailAuthGate>
    </BackdoorPasswordGate>
  );
}
