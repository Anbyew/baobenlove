import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PasswordGate } from './components/PasswordGate';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <PasswordGate>
        <RouterProvider router={router} />
      </PasswordGate>
    </LanguageProvider>
  );
}