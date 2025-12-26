import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Language = 'he' | 'en' | 'hi';

interface Translation {
  id: string;
  key: string;
  he: string;
  en: string | null;
  hi: string | null;
  context: string | null;
}

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  translations: Translation[];
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'he';
  });

  const { data: translations = [], isLoading } = useQuery({
    queryKey: ['translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('translations')
        .select('*');
      if (error) throw error;
      return data as Translation[];
    },
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const translation = translations.find(tr => tr.key === key);
    if (!translation) return fallback || key;
    
    const value = translation[language];
    return value || translation.he || fallback || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, translations, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            language === lang.code
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
          title={lang.label}
        >
          <span className="mr-1">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
