/**
 * Système i18n léger, SSR-safe (sans dépendance i18next).
 * Inspiré de l'implémentation statique de zugher.com.
 *
 * Usage :
 *   const { t, locale, setLocale } = useI18n();
 *   <h1 dangerouslySetInnerHTML={{ __html: t("home.h1") }} />
 *   <p>{t("home.lead")}</p>
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import zh from "./locales/zh.json";

export const LOCALES = {
  fr: { name: "Français", short: "FR", rtl: false },
  en: { name: "English", short: "EN", rtl: false },
  ar: { name: "العربية", short: "AR", rtl: true },
  es: { name: "Español", short: "ES", rtl: false },
  de: { name: "Deutsch", short: "DE", rtl: false },
  zh: { name: "中文", short: "中文", rtl: false },
} as const;

export type Locale = keyof typeof LOCALES;

const dictionaries: Record<Locale, Record<string, string>> = {
  fr: fr as Record<string, string>,
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
  es: es as Record<string, string>,
  de: de as Record<string, string>,
  zh: zh as Record<string, string>,
};

const STORAGE_KEY = "zugher.locale";
const DEFAULT_LOCALE: Locale = "fr";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && v in LOCALES;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR : on rend toujours en FR ; le client réhydrate ensuite la locale stockée.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved) && saved !== locale) {
        setLocaleState(saved);
      }
    } catch {
      // localStorage indisponible
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cfg = LOCALES[locale];
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", cfg.rtl ? "rtl" : "ltr");
    document.body.classList.toggle("rtl", cfg.rtl);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = dictionaries[locale];
      if (dict && dict[key] != null) return dict[key];
      // Fallback en FR, puis fallback fourni, puis la clé brute.
      const frDict = dictionaries.fr;
      if (frDict[key] != null) return frDict[key];
      return fallback ?? key;
    },
    [locale],
  );

  const value = useMemo<Ctx>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback inerte si le provider n'enveloppe pas le composant (ex : pendant SSR error page).
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key, fallback) => dictionaries.fr[key] ?? fallback ?? key,
    };
  }
  return ctx;
}
