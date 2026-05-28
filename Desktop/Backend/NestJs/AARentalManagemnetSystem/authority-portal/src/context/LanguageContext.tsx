import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredLocale,
  resolveTranslation,
  storeLocale,
  type Locale,
  type TranslationSection,
} from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (section: TranslationSection, key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
    document.documentElement.lang = next === "am" ? "am" : "en";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "am" ? "am" : "en";
  }, [locale]);

  const t = useCallback(
    (section: TranslationSection, key: string) =>
      resolveTranslation(locale, section, key),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
