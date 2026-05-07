import type { TrackStyle } from "@/types/music";

export interface PromptTemplate {
  id: string;
  category: string;
  genre: string;
  label: string;
  description: string;
  prompt: string;
  negativePrompt: string;
  style: Partial<TrackStyle>;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // --- Electronic ---
  {
    id: "electronic-techno",
    category: "Electronic",
    genre: "Electronic",
    label: "Techno",
    description: "Hard-hitting industrial techno with driving kick drums and hypnotic loops.",
    prompt:
      "Dark industrial techno track with driving 4/4 kick drums at 138 BPM, distorted synthesizer bassline, metallic percussion layers, atmospheric acid synth stabs, tension-building breakdown, and relentless hypnotic groove. Club-ready mix with punchy low end and crisp high-hat patterns.",
    negativePrompt: "vocals, melody, pop elements, happy, bright, acoustic instruments",
    style: {
      genre: "Electronic",
      moods: ["Dark", "Energetic", "Powerful"],
      tempo: 138,
      key: "A",
      isMinor: true,
      instruments: ["Synthesizer", "Drums"],
      vocalStyle: "Instrumental",
      duration: "3m",
    },
  },
  {
    id: "electronic-ambient-synth",
    category: "Electronic",
    genre: "Ambient",
    label: "Ambient Synth",
    description: "Lush, evolving ambient soundscape with dreamy pads and gentle textures.",
    prompt:
      "Expansive ambient electronic piece with slowly evolving synthesizer pads, subtle filtered arpeggios, soft reverb tails, and warm drone layers. Meditative and otherworldly texture that floats between spacious silences. Inspired by Brian Eno's generative ambient work. Gentle tape-warble effect for warmth.",
    negativePrompt: "drums, percussion, distortion, harsh sounds, vocals, upbeat rhythm",
    style: {
      genre: "Ambient",
      moods: ["Peaceful", "Dreamy", "Mysterious"],
      tempo: 72,
      key: "D",
      isMinor: false,
      instruments: ["Synthesizer"],
      vocalStyle: "Instrumental",
      duration: "3m",
    },
  },
  {
    id: "electronic-future-bass",
    category: "Electronic",
    genre: "Electronic",
    label: "Future Bass",
    description: "Vibrant future bass with emotional chord plucks and punchy drops.",
    prompt:
      "Colorful future bass track with supersized synth chords, emotional melodic lead, pitched vocal chops, crisp trap-influenced hi-hats, punchy 808 bass, and an explosive euphoric drop. Energy builds through layered arpeggios. Bright and uplifting atmosphere with festival-ready dynamics.",
    negativePrompt: "dark, minor key, slow, acoustic, jazz, classical",
    style: {
      genre: "Electronic",
      moods: ["Energetic", "Happy", "Uplifting"],
      tempo: 150,
      key: "G",
      isMinor: false,
      instruments: ["Synthesizer", "Bass"],
      vocalStyle: "Mixed Vocals",
      duration: "3m",
    },
  },

  // --- Hip-Hop ---
  {
    id: "hiphop-trap",
    category: "Hip-Hop",
    genre: "Hip-Hop",
    label: "Trap",
    description: "Modern trap beat with 808s, triplet hi-hats, and cinematic strings.",
    prompt:
      "Hard-hitting modern trap instrumental at 140 BPM half-time feel, booming 808 bass slides, rapid triplet hi-hat rolls, punchy layered snares, melodic piano loop, atmospheric string stabs, and haunting vocal samples. Dark and cinematic mood with premium mix quality suitable for major label placement.",
    negativePrompt: "live drums, acoustic guitar, jazz, bright, happy, folk",
    style: {
      genre: "Hip-Hop",
      moods: ["Dark", "Powerful", "Energetic"],
      tempo: 140,
      key: "F#",
      isMinor: true,
      instruments: ["Piano", "Bass", "Drums", "Synthesizer"],
      vocalStyle: "Rap",
      duration: "3m",
    },
  },
  {
    id: "hiphop-lofi",
    category: "Hip-Hop",
    genre: "Hip-Hop",
    label: "Lo-Fi Hip-Hop",
    description: "Cozy lo-fi beat with vinyl crackle, mellow chords, and laid-back drums.",
    prompt:
      "Relaxing lo-fi hip-hop beat with vintage vinyl crackle, mellow jazz-influenced chord progressions on Rhodes piano, dusty sampled drum break at 85 BPM, warm bass groove, soft guitar riffs, and gentle tape saturation. Study and focus aesthetic. Nostalgic and comfortable atmosphere like a rainy afternoon in a cozy coffee shop.",
    negativePrompt: "harsh sounds, distortion, bright synths, energetic, loud, aggressive",
    style: {
      genre: "Hip-Hop",
      moods: ["Chill", "Nostalgic", "Peaceful"],
      tempo: 85,
      key: "C",
      isMinor: false,
      instruments: ["Piano", "Guitar", "Bass", "Drums"],
      vocalStyle: "Instrumental",
      duration: "3m",
    },
  },
  {
    id: "hiphop-boom-bap",
    category: "Hip-Hop",
    genre: "Hip-Hop",
    label: "Boom Bap",
    description: "Classic East Coast boom bap with punchy kicks, crackling snares, and soul samples.",
    prompt:
      "Classic New York boom bap beat at 90 BPM, punchy kick drum, sharp snapping snare, dusty soul sample chops from a vintage vinyl record, warm bass line, jazzy piano stabs, subtle scratching elements. Gritty and authentic 90s East Coast hip-hop sound. Inspired by Pete Rock and DJ Premier production style.",
    negativePrompt: "electronic synths, 808 bass, trap hi-hats, auto-tune, modern production",
    style: {
      genre: "Hip-Hop",
      moods: ["Groovy", "Nostalgic", "Energetic"],
      tempo: 90,
      key: "A",
      isMinor: false,
      instruments: ["Piano", "Bass", "Drums"],
      vocalStyle: "Rap",
      duration: "3m",
    },
  },

  // --- Cinematic ---
  {
    id: "cinematic-epic-orchestral",
    category: "Cinematic",
    genre: "Cinematic",
    label: "Epic Orchestral",
    description: "Massive cinematic orchestral score with choir, brass, and powerful percussion.",
    prompt:
      "Epic cinematic orchestral score with full symphony orchestra, powerful brass fanfare, massive choir swell, thunderous orchestral percussion, soaring violin melody, and tension-building crescendo. Suitable for a blockbuster film trailer or video game boss battle. Inspired by Hans Zimmer and John Powell. Dramatic, triumphant, larger than life.",
    negativePrompt: "electronic, synthesizer, pop, casual, quiet, minimal",
    style: {
      genre: "Cinematic",
      moods: ["Epic", "Powerful", "Uplifting"],
      tempo: 120,
      key: "D",
      isMinor: false,
      instruments: ["Violin", "Cello", "Trumpet", "Harp", "Drums"],
      vocalStyle: "Choir",
      duration: "3m",
    },
  },
  {
    id: "cinematic-dark-thriller",
    category: "Cinematic",
    genre: "Cinematic",
    label: "Dark Thriller",
    description: "Tense, unsettling thriller score with dissonant strings and eerie atmospherics.",
    prompt:
      "Dark psychological thriller film score with dissonant string clusters, eerie prepared piano notes, subtle heartbeat-like pulse, creeping bass movement, micro-tonal tension, sudden sharp accents, and spine-chilling atmospheric textures. Inspired by Bernard Herrmann and Jonny Greenwood. Deeply unsettling and claustrophobic.",
    negativePrompt: "happy, major key, bright, uplifting, rhythm, electronic, vocals",
    style: {
      genre: "Cinematic",
      moods: ["Dark", "Tense", "Mysterious"],
      tempo: 60,
      key: "B",
      isMinor: true,
      instruments: ["Violin", "Cello", "Piano"],
      vocalStyle: "Instrumental",
      duration: "2m",
    },
  },
  {
    id: "cinematic-uplifting",
    category: "Cinematic",
    genre: "Cinematic",
    label: "Uplifting Score",
    description: "Warm, hopeful cinematic score with strings and piano perfect for emotional moments.",
    prompt:
      "Uplifting and emotionally resonant cinematic score with delicate piano theme, warm string ensemble, subtle woodwinds, gentle harp arpeggios, and a powerful yet tender orchestral build. Perfect for a film's redemption arc or heartfelt reunion scene. Inspired by Thomas Newman and Ennio Morricone's gentler works. Bittersweet and deeply human.",
    negativePrompt: "electronic, dark, harsh, aggressive, percussion-heavy, distortion",
    style: {
      genre: "Cinematic",
      moods: ["Uplifting", "Melancholic", "Emotional"],
      tempo: 78,
      key: "E",
      isMinor: false,
      instruments: ["Piano", "Violin", "Cello", "Flute", "Harp"],
      vocalStyle: "Instrumental",
      duration: "3m",
    },
  },

  // --- Rock ---
  {
    id: "rock-indie",
    category: "Rock",
    genre: "Indie",
    label: "Indie Rock",
    description: "Jangly indie rock with layered guitars, driving rhythm section, and hazy vocals.",
    prompt:
      "Indie rock track with jangly clean electric guitar arpeggios, layered strumming, punchy live drum kit, melodic bass line, hazy reverb-soaked lead guitar, and anthemic chorus energy. Reminiscent of The National, Interpol, and Parquet Courts. Slightly lo-fi recording aesthetic with warmth and character. Introspective lyrics-ready.",
    negativePrompt: "electronic, synthesizer, hip-hop, heavy distortion, classical, ambient",
    style: {
      genre: "Indie",
      moods: ["Melancholic", "Energetic", "Nostalgic"],
      tempo: 120,
      key: "G",
      isMinor: false,
      instruments: ["Guitar", "Bass", "Drums"],
      vocalStyle: "Male Vocals",
      duration: "3m",
    },
  },
  {
    id: "rock-heavy-metal",
    category: "Rock",
    genre: "Metal",
    label: "Heavy Metal",
    description: "Crushing heavy metal with down-tuned guitars, blast beats, and aggressive riffs.",
    prompt:
      "Heavy metal track with aggressive down-tuned guitar riffs, thunderous double kick drum blast beats, chugging palm-muted low-end chug patterns, shredding guitar solo, bass drop accents, and powerful rhythmic breakdowns. Influenced by Pantera and Lamb of God. Raw and relentless with pristine yet heavy production.",
    negativePrompt: "pop, electronic, acoustic, soft, ambient, jazz, happy, light",
    style: {
      genre: "Metal",
      moods: ["Angry", "Powerful", "Energetic"],
      tempo: 180,
      key: "E",
      isMinor: true,
      instruments: ["Guitar", "Bass", "Drums"],
      vocalStyle: "Male Vocals",
      duration: "3m",
    },
  },

  // --- Jazz ---
  {
    id: "jazz-smooth",
    category: "Jazz",
    genre: "Jazz",
    label: "Smooth Jazz",
    description: "Silky smooth jazz with soulful saxophone, walking bass, and brushed drums.",
    prompt:
      "Smooth jazz composition with a warm tenor saxophone melody, lush chord voicings on electric piano, walking upright bass line, subtle brushed drum kit, soft trumpet countermelody, and rich jazz harmony. Late night lounge aesthetic. Inspired by Kenny G, David Sanborn, and Grover Washington Jr. Sophisticated and sensual.",
    negativePrompt: "electronic, distortion, aggressive, drums-heavy, trap, hip-hop, loud",
    style: {
      genre: "Jazz",
      moods: ["Chill", "Romantic", "Groovy"],
      tempo: 88,
      key: "F",
      isMinor: false,
      instruments: ["Saxophone", "Piano", "Bass", "Drums", "Trumpet"],
      vocalStyle: "Instrumental",
      duration: "3m",
    },
  },
  {
    id: "jazz-neo-soul",
    category: "Jazz",
    genre: "Soul",
    label: "Neo Soul",
    description: "Lush neo-soul groove with vintage keys, smooth chord progressions, and warm bass.",
    prompt:
      "Neo-soul track with vintage Rhodes electric piano chords, smooth jazz-influenced harmony, warm synth bass groove, live-feeling drum kit with ghost notes, subtle guitar wah-wah accents, soft organ swells, and an intimate soulful vocal ready production. Inspired by D'Angelo, Erykah Badu, and Hiatus Kaiyote. Deeply soulful and textured.",
    negativePrompt: "pop, electronic, trap, harsh, aggressive, commercial",
    style: {
      genre: "Soul",
      moods: ["Groovy", "Romantic", "Chill"],
      tempo: 92,
      key: "Bb",
      isMinor: false,
      instruments: ["Piano", "Guitar", "Bass", "Drums", "Organ"],
      vocalStyle: "Female Vocals",
      duration: "3m",
    },
  },

  // --- Latin ---
  {
    id: "latin-reggaeton",
    category: "Latin",
    genre: "Latin",
    label: "Reggaeton",
    description: "Hard-hitting reggaeton with the classic dembow rhythm, deep 808s, and Latin flavor.",
    prompt:
      "Modern reggaeton track with iconic dembow rhythm pattern, booming 808 bass, punchy layered percussion, infectious melodic hook, synth stabs, and urban Latin street energy. Club-ready production with current urban Latin sound. Inspired by Bad Bunny and J Balvin production aesthetics. High energy and anthemic.",
    negativePrompt: "acoustic, jazz, classical, slow, quiet, rock, metal",
    style: {
      genre: "Latin",
      moods: ["Energetic", "Groovy", "Happy"],
      tempo: 96,
      key: "D",
      isMinor: false,
      instruments: ["Bass", "Drums", "Synthesizer"],
      vocalStyle: "Mixed Vocals",
      duration: "3m",
    },
  },
  {
    id: "latin-bossa-nova",
    category: "Latin",
    genre: "Latin",
    label: "Bossa Nova",
    description: "Elegant Brazilian bossa nova with nylon guitar, brushed drums, and soft jazz harmonies.",
    prompt:
      "Classic Brazilian bossa nova with fingerpicked nylon string guitar, light samba-influenced brushed drum pattern, upright double bass, warm flute melody, and lush jazz chord voicings. Intimate and sophisticated atmosphere reminiscent of Joao Gilberto and Stan Getz. Sun-drenched and elegantly restrained.",
    negativePrompt: "electronic, electric guitar, distortion, loud, aggressive, pop, hip-hop",
    style: {
      genre: "Latin",
      moods: ["Chill", "Romantic", "Peaceful"],
      tempo: 130,
      key: "C",
      isMinor: false,
      instruments: ["Guitar", "Bass", "Drums", "Flute"],
      vocalStyle: "Female Vocals",
      duration: "3m",
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  "Electronic",
  "Hip-Hop",
  "Cinematic",
  "Rock",
  "Jazz",
  "Latin",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
