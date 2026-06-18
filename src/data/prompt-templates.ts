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
  /**
   * Optional starter lyrics (with Suno-style section tags). Used when a track is
   * created directly from a template so the first version already has a
   * structured lyric scaffold to edit.
   */
  lyrics?: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // --- Católico (música católica brasileira / litúrgica) ---
  {
    id: "catholic-louvor",
    category: "Católico",
    genre: "Louvor",
    label: "Louvor & Adoração",
    description:
      "Louvor católico contemporâneo de banda, com refrão congregacional caloroso e cheio de esperança.",
    prompt:
      "Contemporary Brazilian Catholic praise and worship song (louvor e adoração), full live band with warm acoustic and chiming electric guitars, grand piano, melodic bass, energetic but tasteful drums, layered congregational backing vocals, anthemic uplifting chorus, bright and hopeful production, sung in Brazilian Portuguese, reverent and joyful.",
    negativePrompt:
      "heavy metal, harsh distortion, aggressive screaming, EDM club drop, rap, profane or secular lyrics, dark, sensual",
    style: {
      genre: "Pop",
      moods: ["Uplifting", "Happy", "Powerful"],
      tempo: 120,
      key: "G",
      isMinor: false,
      instruments: ["Guitar", "Piano", "Bass", "Drums"],
      vocalStyle: "Mixed Vocals",
      duration: "3m",
    },
    lyrics: `[Verse]
Em Tua presença eu quero estar
Teu amor me faz recomeçar
Abro o coração diante de Ti
Tudo o que sou entrego a Ti

[Chorus]
Santo és, Senhor, digno de louvor
Toda a terra canta o Teu amor
Levanto as mãos, rendido a Ti
Em Tua graça eu vou seguir

[Verse]
Tua bondade me sustentará
Tua fidelidade não falhará
Em meio à tempestade eu vou cantar
Que o Teu nome é o meu lugar

[Bridge]
Aleluia, aleluia
Cristo vive, ressuscitou
Aleluia, aleluia
O meu Redentor me alcançou`,
  },
  {
    id: "catholic-adoracao-taize",
    category: "Católico",
    genre: "Taizé",
    label: "Adoração Contemplativa (Taizé)",
    description:
      "Canto meditativo no estilo de Taizé: refrão repetido em ostinato, coro suave à luz de velas.",
    prompt:
      "Meditative Taizé-style ecumenical chant, a short prayerful refrain repeated as a gentle ostinato, soft choir singing in canon, warm sustained pipe organ, delicate strings and flute, candlelit contemplative atmosphere, spacious reverb of a quiet chapel, Latin and Portuguese sacred text, calm and timeless.",
    negativePrompt:
      "drums, percussion, electronic, synth bass, loud, energetic, fast, distortion, rap, beat drop",
    style: {
      genre: "Classical",
      moods: ["Peaceful", "Dreamy", "Uplifting"],
      tempo: 64,
      key: "D",
      isMinor: true,
      instruments: ["Organ", "Violin", "Flute"],
      vocalStyle: "Choir",
      duration: "3m",
    },
    lyrics: `[Verse]
Nada te perturbe, nada te espante
Quem a Deus tem, nada lhe falta
Nada te perturbe, nada te espante
Só Deus basta

[Chorus]
Laudate omnes gentes, laudate Dominum
Laudate omnes gentes, laudate Dominum

[Verse]
No silêncio Tua voz me chama
Na espera meu coração descansa
No silêncio Tua paz me abraça
Só Deus basta`,
  },
  {
    id: "catholic-mariano",
    category: "Católico",
    genre: "Mariano",
    label: "Mariano",
    description:
      "Hino mariano terno em homenagem a Nossa Senhora, com violão dedilhado e voz suave.",
    prompt:
      "Tender Brazilian Marian hymn honoring Our Lady (Nossa Senhora), gentle fingerpicked nylon-string guitar, soft piano, delicate harp arpeggios, warm flute countermelody, intimate and devotional female lead vocal, contemplative and consoling, sung in Brazilian Portuguese, sincere and reverent.",
    negativePrompt:
      "aggressive, distortion, heavy drums, electronic, rap, secular club, dark, dissonant",
    style: {
      genre: "Folk",
      moods: ["Peaceful", "Melancholic", "Dreamy"],
      tempo: 72,
      key: "C",
      isMinor: false,
      instruments: ["Guitar", "Piano", "Harp", "Flute"],
      vocalStyle: "Female Vocals",
      duration: "3m",
    },
    lyrics: `[Verse]
Maria, mãe do Salvador
Estrela que conduz ao bem
Em teu olhar encontro amor
Em teu colo a paz me vem

[Chorus]
Ave Maria, cheia de graça
Roga por nós, mãe de Jesus
Ave Maria, nossa esperança
Guia meus passos para a luz

[Verse]
No sim que um dia tu disseste
O céu à terra se encontrou
Ensina-me a dizer também
Senhor, faça-se em mim Teu amor`,
  },
  {
    id: "catholic-missa-liturgica",
    category: "Católico",
    genre: "Litúrgico",
    label: "Missa / Litúrgico",
    description:
      "Hino litúrgico solene para a Missa, com órgão de tubos e coro em clima de catedral.",
    prompt:
      "Solemn Catholic liturgical hymn for the Mass, majestic pipe organ, full SATB choir in four-part harmony, supporting strings, reverent sacred cathedral atmosphere with long natural reverb, suitable for entrance or communion procession, dignified and prayerful, sung in Portuguese with occasional Latin, noble and timeless.",
    negativePrompt:
      "electronic, drum kit, pop beat, distortion, rap, secular, aggressive, synthesizer",
    style: {
      genre: "Classical",
      moods: ["Peaceful", "Epic", "Uplifting"],
      tempo: 76,
      key: "D",
      isMinor: false,
      instruments: ["Organ", "Violin", "Cello"],
      vocalStyle: "Choir",
      duration: "3m",
    },
    lyrics: `[Verse]
Eis-nos aqui, Senhor, em Tua casa
Reunidos pelo Teu amor
Como um só povo a Ti cantamos
Glória e louvor ao Criador

[Chorus]
Santo, Santo, Santo é o Senhor
Deus do universo e do altar
O céu e a terra proclamam
A grandeza do Seu amar

[Verse]
Na fração do pão nos encontramos
Cristo se faz comunhão
Um só corpo, um só Espírito
Caminhamos rumo à salvação`,
  },
  {
    id: "catholic-sertanejo-gospel",
    category: "Católico",
    genre: "Sertanejo",
    label: "Sertanejo Gospel",
    description:
      "Balada sertaneja de fé, com viola caipira, sanfona e voz emocionada de testemunho.",
    prompt:
      "Heartfelt Brazilian sertanejo gospel ballad, twangy viola caipira and acoustic guitar, expressive accordion (sanfona), gentle bass and brushed drums, warm emotive male lead with second-voice harmony, sincere testimony of faith and gratitude to God, countryside warmth, sung in Brazilian Portuguese, devotional and tender.",
    negativePrompt:
      "heavy metal, EDM, trap, rap, harsh distortion, profane, electronic synth lead",
    style: {
      genre: "Country",
      moods: ["Uplifting", "Nostalgic", "Happy"],
      tempo: 92,
      key: "G",
      isMinor: false,
      instruments: ["Guitar", "Bass", "Drums", "Violin"],
      vocalStyle: "Male Vocals",
      duration: "3m",
    },
    lyrics: `[Verse]
No meio da estrada eu me perdi
Carreguei sozinho a minha cruz
Mas no fundo escuro eu Te ouvi
Me chamando de volta à luz

[Chorus]
Foi Tua mão que me levantou
Foi Teu amor que me sustentou
Hoje eu canto pra Te agradecer
Sem Ti, Senhor, eu não sei viver

[Verse]
Como filho que volta pra casa
Tu me abraças e fazes a festa
Matas a saudade, secas meu pranto
Tua graça é tudo o que me resta`,
  },
  {
    id: "catholic-mpb-sacra",
    category: "Católico",
    genre: "MPB Sacra",
    label: "MPB Sacra",
    description:
      "Hino católico brasileiro tradicional com influência de MPB, violão e coro congregacional.",
    prompt:
      "Traditional Brazilian Catholic hymn with MPB influence, warm acoustic nylon guitar, gentle piano, soft congregational choir, subtle flute, devotional and uplifting, intimate and sincere production, sung in Brazilian Portuguese, reverent and welcoming.",
    negativePrompt:
      "electronic, harsh distortion, aggressive, rap, secular club, dark, heavy drums",
    style: {
      genre: "Folk",
      moods: ["Peaceful", "Uplifting", "Dreamy"],
      tempo: 84,
      key: "C",
      isMinor: false,
      instruments: ["Guitar", "Piano", "Flute"],
      vocalStyle: "Mixed Vocals",
      duration: "3m",
    },
    lyrics: `[Verse]
Senhor, eu venho a Ti
Com o coração aberto
Tua graça me sustém
No caminho que é certo

[Chorus]
Glória a Deus nas alturas
Paz na terra aos seus amados
Com amor nos envolveu
Somos seus abençoados

[Bridge]
Na Tua presença encontro paz
A Tua palavra é verdade
Caminho seguro me dás
Em Tua infinita bondade`,
  },
  {
    id: "catholic-natal",
    category: "Católico",
    genre: "Natal",
    label: "Natal / Advento",
    description:
      "Canção de Natal católica, alegre e cheia de ternura, com sinos, cordas e coro.",
    prompt:
      "Joyful Brazilian Catholic Christmas hymn (canção de Natal), warm hand bells and glockenspiel, lush strings, harp, gentle acoustic guitar, children and adult choir together, wonder of the Nativity, festive yet reverent and tender, sung in Brazilian Portuguese, warm and luminous.",
    negativePrompt:
      "dark, aggressive, distortion, electronic club, rap, secular party, dissonant",
    style: {
      genre: "Cinematic",
      moods: ["Happy", "Peaceful", "Uplifting"],
      tempo: 96,
      key: "D",
      isMinor: false,
      instruments: ["Piano", "Harp", "Violin", "Flute"],
      vocalStyle: "Choir",
      duration: "3m",
    },
    lyrics: `[Verse]
Numa noite de silêncio e paz
Uma estrela veio a brilhar
Em Belém, num simples presépio
O Senhor quis se humanar

[Chorus]
Glória a Deus, nasceu o Salvador
Cantai, ó povos, com alegria
Veio ao mundo o Rei de amor
Filho de Deus e de Maria

[Verse]
Os pastores correm a adorar
Os anjos cantam no céu sem fim
O Emanuel veio habitar
Deus conosco, enfim`,
  },
  {
    id: "catholic-gregoriano",
    category: "Católico",
    genre: "Gregoriano",
    label: "Canto Gregoriano",
    description:
      "Canto gregoriano monofônico em latim, schola masculina a cappella sob abóbadas de pedra.",
    prompt:
      "Authentic Gregorian chant, monophonic male schola singing in unison, free-flowing modal melody with no fixed beat, sacred Latin liturgical text, a cappella with no instruments, resonant stone abbey acoustics with long reverb, meditative, austere and timeless.",
    negativePrompt:
      "instruments, drums, percussion, harmony, chords, electronic, modern production, pop, beat, bass",
    style: {
      genre: "Classical",
      moods: ["Peaceful", "Mysterious", "Dreamy"],
      tempo: 60,
      key: "D",
      isMinor: false,
      instruments: [],
      vocalStyle: "Choir",
      duration: "2m",
    },
    lyrics: `[Verse]
Kyrie eleison
Christe eleison
Kyrie eleison

[Verse]
Sanctus, Sanctus, Sanctus
Dominus Deus Sabaoth
Pleni sunt caeli et terra gloria tua
Hosanna in excelsis`,
  },

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
  "Católico",
  "Electronic",
  "Hip-Hop",
  "Cinematic",
  "Rock",
  "Jazz",
  "Latin",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
