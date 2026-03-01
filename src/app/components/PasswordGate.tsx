import { useState, useEffect } from 'react';

const CORRECT_PASSWORD = 'BellaBenBao2026';
const STORAGE_KEY = 'wedding_auth';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setAuthenticated(true);
    }
    setReady(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setAuthenticated(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!ready) return null;
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 w-full max-w-sm">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-12" />

        <h1 className="text-3xl font-light text-foreground tracking-tight mb-2">
          Yuwei & Benjamin
        </h1>
        <p className="text-sm font-light text-foreground/60 tracking-wider mb-12">
          October 3, 2026
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password"
            autoFocus
            className="w-full border-b border-foreground/20 focus:border-primary bg-transparent py-3 text-center font-light text-foreground placeholder:text-foreground/30 outline-none transition-colors duration-300"
          />
          {error && (
            <p className="text-xs text-destructive font-light tracking-wider">
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-sm tracking-widest uppercase font-light transition-all duration-300 mt-4"
          >
            Enter
          </button>
        </form>

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-12" />
      </div>
    </div>
  );
}
