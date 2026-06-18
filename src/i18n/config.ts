// Locale configuration for the app UI internationalization.
// The UI supports Brazilian Portuguese (default), English and Spanish.

export const LOCALES = ["pt-BR", "en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

// Cookie used to persist the visitor's UI language across requests.
export const LOCALE_COOKIE = "musicalizer-locale";

// Human-friendly labels shown in the language switcher (each in its own tongue).
export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português",
  en: "English",
  es: "Español",
};

// Short flag-ish badge shown in compact UI.
export const LOCALE_SHORT: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
  es: "ES",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

// The value used for the <html lang> attribute.
export function htmlLang(locale: Locale): string {
  return locale;
}

// Resolve a locale from an arbitrary cookie / header string, falling back to
// the default when it is missing or unrecognised.
export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
