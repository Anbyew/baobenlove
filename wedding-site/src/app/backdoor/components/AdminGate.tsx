import { useState } from 'react';
import { ADMIN_SECTION_AUTH_KEY, ADMIN_SECTION_PASSWORD } from '../lib/backdoor';

// A second password, narrower than the /backdoor entry gate, guarding the
// pages that touch real guest data (RSVP Dashboard, Seating Chart admin path,
// Packing Checklist, To-Do Tracker). Wraps each of those pages directly —
// not just the backdoor hub's link list — so nothing under Admin is
// reachable by a direct URL either. Same client-side-only mechanism as the
// rest of the site's gates: a deterrent for whoever has the link, not a
// security boundary.

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_SECTION_AUTH_KEY) === 'true');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authed) return <>{children}</>;

  const submit = () => {
    if (input === ADMIN_SECTION_PASSWORD) {
      localStorage.setItem(ADMIN_SECTION_AUTH_KEY, 'true');
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
        <h1 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Admin</h1>
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
