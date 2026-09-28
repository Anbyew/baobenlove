import { Link } from 'react-router';
import { BackdoorGate } from '../components/BackdoorGate';

export function MasterTimeline() {
  return (
    <BackdoorGate>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-8" />
          <p className="text-xs tracking-[0.25em] uppercase text-foreground/40 mb-2">baoben.love</p>
          <h1 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Master Timeline</h1>
          <p className="text-sm font-light text-foreground/60">
            Not built yet — waiting on the details to fill this in.
          </p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-8" />
          <Link to="/backdoor" className="mt-8 inline-block text-xs tracking-[0.25em] uppercase text-foreground/40 hover:text-foreground/70">
            ← Backdoor
          </Link>
        </div>
      </div>
    </BackdoorGate>
  );
}
