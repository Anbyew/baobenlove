import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PasswordGate } from './components/PasswordGate';
// TODO: re-enable EmailAuthGate once Gmail OAuth credentials are configured in Netlify
// import { EmailAuthGate } from './components/EmailAuthGate';
import { LanguageProvider } from './context/LanguageContext';
import { GuestIdentityProvider } from './context/GuestIdentityContext';
import { GuestSessionProvider } from './context/GuestSessionContext';

export default function App() {
  return (
    <LanguageProvider>
      <GuestIdentityProvider>
        <GuestSessionProvider>
          <PasswordGate>
            {/* <EmailAuthGate> */}
            <RouterProvider router={router} />
            {/* </EmailAuthGate> */}
          </PasswordGate>
        </GuestSessionProvider>
      </GuestIdentityProvider>
    </LanguageProvider>
  );
}
