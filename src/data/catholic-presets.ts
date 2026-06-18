import type { SongLanguage, TrackStyle } from "@/types/music";

// Catholic niche specialization: preset themes and mixable musical styles.
// The `id` of each theme/blend matches a key under `catholic.themes.*` and
// `catholic.styleBlends.*` in the i18n dictionaries so the UI can localize the
// display name, while the descriptive fields here steer the AI composer.

export type CatholicThemeId =
  | "nossaSenhora"
  | "amorDivino"
  | "santos"
  | "espiritoSanto"
  | "louvoresAnimados";

export interface CatholicTheme {
  id: CatholicThemeId;
  // Canonical Portuguese name + description, stored on the seeded `themes` row.
  canonicalName: string;
  canonicalDescription: string;
  color: string;
  // Nuance keywords woven into the generation prompt (Portuguese on purpose,
  // since the default sung language is Portuguese and these set the devotional tone).
  keywords: string[];
  suggestedGenre: string;
  suggestedMoods: string[];
  suggestedVocalStyle: string;
  suggestedTempo: number;
  instruments: string[];
  // English brief that orients the AI on the doctrinal / emotional core of the theme.
  brief: string;
}

export const CATHOLIC_THEMES: readonly CatholicTheme[] = [
  {
    id: "nossaSenhora",
    canonicalName: "Nossa Senhora",
    canonicalDescription:
      "Cânticos marianos de devoção, ternura e entrega à Mãe de Deus.",
    color: "sky",
    keywords: ["Maria", "Mãe", "Ave Maria", "intercessão", "ternura", "manto"],
    suggestedGenre: "Folk",
    suggestedMoods: ["Peaceful", "Romantic", "Uplifting"],
    suggestedVocalStyle: "Female Vocals",
    suggestedTempo: 80,
    instruments: ["Acoustic Guitar", "Strings", "Piano"],
    brief:
      "A Marian devotional song honoring the Blessed Virgin Mary as Mother and intercessor: tender, reverent, full of trust and filial love.",
  },
  {
    id: "amorDivino",
    canonicalName: "Amor Divino",
    canonicalDescription:
      "A misericórdia e o amor incondicional de Deus pela humanidade.",
    color: "rose",
    keywords: ["misericórdia", "graça", "perdão", "coração", "entrega"],
    suggestedGenre: "Pop",
    suggestedMoods: ["Uplifting", "Romantic", "Peaceful"],
    suggestedVocalStyle: "Mixed Vocals",
    suggestedTempo: 92,
    instruments: ["Piano", "Acoustic Guitar", "Strings"],
    brief:
      "A worship song about God's unconditional, merciful love for humanity — intimate, hopeful and surrendered.",
  },
  {
    id: "santos",
    canonicalName: "Santos",
    canonicalDescription:
      "Celebração da vida e do testemunho dos santos e mártires.",
    color: "amber",
    keywords: ["santidade", "testemunho", "fé", "coragem", "exemplo", "mártires"],
    suggestedGenre: "Folk",
    suggestedMoods: ["Epic", "Uplifting", "Powerful"],
    suggestedVocalStyle: "Choir",
    suggestedTempo: 100,
    instruments: ["Acoustic Guitar", "Strings", "Organ", "Drums"],
    brief:
      "A song celebrating the saints and martyrs — their holiness, witness and courage as inspiring examples for the faithful.",
  },
  {
    id: "espiritoSanto",
    canonicalName: "Espírito Santo",
    canonicalDescription:
      "Invocação do Espírito Santo, seus dons e o fogo de Pentecostes.",
    color: "orange",
    keywords: ["vinde", "fogo", "dons", "Pentecostes", "sopro", "renovação"],
    suggestedGenre: "Gospel",
    suggestedMoods: ["Powerful", "Uplifting", "Epic"],
    suggestedVocalStyle: "Mixed Vocals",
    suggestedTempo: 110,
    instruments: ["Piano", "Organ", "Drums", "Bass", "Electric Guitar"],
    brief:
      "An invocation of the Holy Spirit — His gifts, the fire of Pentecost and the breath that renews the Church; fervent and anointed.",
  },
  {
    id: "louvoresAnimados",
    canonicalName: "Louvores Animados",
    canonicalDescription:
      "Louvores festivos e contagiantes para celebrar com alegria.",
    color: "violet",
    keywords: ["aleluia", "alegria", "festa", "palmas", "celebração", "dança"],
    suggestedGenre: "Pop",
    suggestedMoods: ["Happy", "Energetic", "Uplifting", "Groovy"],
    suggestedVocalStyle: "Mixed Vocals",
    suggestedTempo: 128,
    instruments: ["Drums", "Bass", "Electric Guitar", "Piano", "Percussion"],
    brief:
      "An upbeat, festive praise song meant for joyful congregational celebration — contagious energy, hand-clapping and dancing.",
  },
];

export function getCatholicTheme(
  id: CatholicThemeId
): CatholicTheme | undefined {
  return CATHOLIC_THEMES.find((t) => t.id === id);
}

export type CatholicStyleBlendId =
  | "reggae"
  | "sertanejo"
  | "gospel"
  | "pop"
  | "acustico"
  | "rock"
  | "pagode"
  | "mpb"
  | "forro"
  | "eletronico"
  | "gregoriano"
  | "orquestral"
  | "infantil";

export interface CatholicStyleBlend {
  id: CatholicStyleBlendId;
  // Phrase woven into the generation prompt to color the arrangement.
  descriptor: string;
}

export const CATHOLIC_STYLE_BLENDS: readonly CatholicStyleBlend[] = [
  { id: "reggae", descriptor: "reggae groove with off-beat skank guitar and a laid-back bassline" },
  { id: "sertanejo", descriptor: "Brazilian sertanejo feel with viola caipira and accordion" },
  { id: "gospel", descriptor: "contemporary gospel/praise arrangement with rich backing vocals" },
  { id: "pop", descriptor: "modern radio-friendly pop production" },
  { id: "acustico", descriptor: "intimate acoustic, guitar-and-voice arrangement" },
  { id: "rock", descriptor: "energetic rock band with driving electric guitars and drums" },
  { id: "pagode", descriptor: "Brazilian pagode/samba groove with cavaquinho and pandeiro" },
  { id: "mpb", descriptor: "sophisticated MPB (Brazilian popular music) harmony and feel" },
  { id: "forro", descriptor: "northeastern Brazilian forró with zabumba, accordion and triangle" },
  { id: "eletronico", descriptor: "modern electronic production with synth pads and programmed beats" },
  { id: "gregoriano", descriptor: "Gregorian-chant-inspired modal melodies and reverberant vocals" },
  { id: "orquestral", descriptor: "cinematic orchestral arrangement with strings and brass" },
  { id: "infantil", descriptor: "playful, simple children's-song melody that is easy to sing along" },
];

export function getCatholicStyleBlend(
  id: string
): CatholicStyleBlend | undefined {
  return CATHOLIC_STYLE_BLENDS.find((b) => b.id === id);
}

// Assemble the TrackStyle for a catholic composition from the chosen theme,
// language and instrumental flag. The blended musical styles live in the prompt.
export function buildCatholicStyle(
  themeId: CatholicThemeId,
  language: SongLanguage,
  instrumental: boolean
): TrackStyle {
  const theme = getCatholicTheme(themeId) ?? CATHOLIC_THEMES[0];
  return {
    genre: theme.suggestedGenre,
    moods: [...theme.suggestedMoods],
    tempo: theme.suggestedTempo,
    key: "C",
    isMinor: false,
    instruments: [...theme.instruments],
    vocalStyle: instrumental ? "Instrumental" : theme.suggestedVocalStyle,
    duration: "3m",
    language,
    provider: "suno",
    sunoApiVersion: "v5.5",
    minimaxModel: "music-1.5",
    audioQuality: { sampleRate: 44100, bitrate: 256000, format: "mp3" },
  };
}
