
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, LanguageKey } from '@/lib/translations';

type LanguageContextType = {
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
  t: any;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageKey>('English');

  useEffect(() => {
    const saved = localStorage.getItem('app-language') as LanguageKey;
    if (saved && TRANSLATIONS[saved]) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: LanguageKey) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: { ...TRANSLATIONS['English'], ...TRANSLATIONS[language] } as typeof TRANSLATIONS['English']
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
