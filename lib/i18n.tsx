'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Locale = 'en' | 'pt-BR';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function useTranslation() {
  return useContext(I18nContext);
}

// Flatten nested keys: { nav: { home: "Home" } } => { "nav.home": "Home" }
function flatten(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flatten(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key]);
    }
  }
  return result;
}

// Cache loaded translations
const translationCache: Partial<Record<Locale, Record<string, string>>> = {};

async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  if (translationCache[locale]) return translationCache[locale]!;
  try {
    const mod = await import(`@/messages/${locale}.json`);
    const flat = flatten(mod.default || mod);
    translationCache[locale] = flat;
    return flat;
  } catch {
    console.warn(`[i18n] Failed to load ${locale} translations`);
    return {};
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved locale
    const saved = localStorage.getItem('homeledger-locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'pt-BR')) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    loadTranslations(locale).then(setMessages);
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('homeledger-locale', newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = messages[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  }, [messages]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
