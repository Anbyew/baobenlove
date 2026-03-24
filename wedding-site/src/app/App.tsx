import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PasswordGate } from './components/PasswordGate';
import { LanguageProvider } from './context/LanguageContext';
import { GuestSessionProvider } from './context/GuestSessionContext';

export default function App() {
  return (
    <LanguageProvider>
      <GuestSessionProvider>
        <PasswordGate>
          <RouterProvider router={router} />
        </PasswordGate>
      </GuestSessionProvider>
    </LanguageProvider>
  );
}
