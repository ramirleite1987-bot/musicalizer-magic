import type { Locale } from "./config";
import ptBR from "./dictionaries/pt-BR";
import en from "./dictionaries/en";
import es from "./dictionaries/es";

// The canonical Portuguese dictionary defines the shape every locale follows.
export type Dictionary = typeof ptBR;

const DICTIONARIES: Record<Locale, Dictionary> = {
  "pt-BR": ptBR,
  en,
  es,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? ptBR;
}

export * from "./config";
