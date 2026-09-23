"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate, type Language, type TranslationKey, type TranslationParams } from "@/lib/i18n/translations";
import { displayValue } from "@/lib/i18n/display";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The server and first client render agree; saved preference is applied after hydration.
  const [language, updateLanguage] = useState<Language>("en");

  useEffect(() => {
    const readPreference = () => {
      let next: Language = "en";
      try {
        if (localStorage.getItem("language") === "th") next = "th";
      } catch {
        // Storage may be blocked. The language control still works for this session.
      }
      updateLanguage(next);
      document.documentElement.lang = next;
    };
    const frame = requestAnimationFrame(readPreference);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "language" || event.key === null) readPreference();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    document.documentElement.lang = next;
    try {
      localStorage.setItem("language", next);
    } catch {
      // Persistence is optional when the browser blocks storage.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key, params) => translate(language, key, params),
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function DisplayValue({ value }: { value: string }) {
  const { language } = useLanguage();

  return <>{displayValue(language, value)}</>;
}