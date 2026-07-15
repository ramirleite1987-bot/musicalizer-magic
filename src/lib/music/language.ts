import {
  DEFAULT_SONG_LANGUAGE,
  type SongLanguage,
  type TrackStyle,
} from "@/types/music";

// English names used when describing the song language to music/AI providers,
// which expect natural-language directions in English.
const SONG_LANGUAGE_NAMES: Record<SongLanguage, string> = {
  pt: "Portuguese (Brazilian)",
  en: "English",
  es: "Spanish",
  la: "Latin",
};

export function songLanguageName(language: SongLanguage | undefined): string {
  return SONG_LANGUAGE_NAMES[language ?? DEFAULT_SONG_LANGUAGE];
}

// A clause appended to provider prompts so the vocals are sung in the chosen
// language. Returns an empty string for instrumental tracks.
export function languageDirective(style: TrackStyle): string {
  if (style.vocalStyle === "None" || style.vocalStyle === "Instrumental") {
    return "";
  }
  return `Sung in ${songLanguageName(style.language)}`;
}
