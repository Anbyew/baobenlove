import { createContext, useContext, useState } from 'react';
import type { Lang } from '../i18n/translations';
import { t } from '../i18n/translations';

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
  t: typeof t['en'];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const toggle = () => setLang((l) => (l === 'en' ? 'zh' : 'en'));

  return (
    <LanguageContext.Provider value={{ lang, toggle, t: t[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
