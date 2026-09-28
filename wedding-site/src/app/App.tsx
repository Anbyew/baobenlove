import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PasswordGate } from './components/PasswordGate';
import { EmailAuthGate } from './components/EmailAuthGate';
import { LanguageProvider } from './context/LanguageContext';
import { GuestIdentityProvider } from './context/GuestIdentityContext';
import { GuestSessionProvider } from './context/GuestSessionContext';

// Everything under /backdoor is owner-only, not a guest page — it skips the
// site's guest password + RSVP-email login and gates itself instead (see
// BackdoorGate.tsx): its own password, then the same email-login flow
// restricted to owner emails. The Admin group under /backdoor/admin/* adds a
// second, narrower password on top of that (see AdminGate.tsx).
//
// /vendor/* is separate: it skips the guest gates too, but is NOT wrapped in
// BackdoorGate at all — e.g. /vendor/seating needs only the seating chart's
// own vendor password, so it can be handed directly to an outside
// florist/coordinator with no owner access.
function bypassesGuestGates(pathname: string) {
  return (
    pathname === '/backdoor' ||
    pathname.startsWith('/backdoor/') ||
    pathname === '/vendor' ||
    pathname.startsWith('/vendor/')
  );
}

export default function App() {
  if (bypassesGuestGates(window.location.pathname)) {
    return (
      <LanguageProvider>
        <GuestIdentityProvider>
          <GuestSessionProvider>
            <RouterProvider router={router} />
          </GuestSessionProvider>
        </GuestIdentityProvider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <GuestIdentityProvider>
        <GuestSessionProvider>
          <PasswordGate>
            <EmailAuthGate>
              <RouterProvider router={router} />
            </EmailAuthGate>
          </PasswordGate>
        </GuestSessionProvider>
      </GuestIdentityProvider>
    </LanguageProvider>
  );
}
