import { LOCALES, useI18n, type Locale } from "@/i18n";

const ORDER: Locale[] = ["fr", "en", "ar", "es", "de", "zh"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="zg-lang-switch" role="group" aria-label="Langue">
      {ORDER.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={`zg-lang-btn${active ? " active" : ""}`}
            aria-pressed={active}
            lang={l}
          >
            {LOCALES[l].short}
          </button>
        );
      })}
    </div>
  );
}
