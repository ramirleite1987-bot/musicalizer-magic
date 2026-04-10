import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Insert themes
  const [th1, th2, , th4, , th6] = await db
    .insert(schema.themes)
    .values([
      {
        name: "Cyberpunk Dystopia",
        description:
          "High tech, low life. Neon-lit streets and corporate espionage.",
        keywords: ["neon", "dystopia", "technology", "rebellion", "urban decay"],
        color: "violet",
        source: "url",
        sourceRef: "https://en.wikipedia.org/wiki/Cyberpunk",
      },
      {
        name: "Lost Love Letters",
        description:
          "The bittersweet feeling of finding old correspondence from a past lover.",
        keywords: [
          "heartbreak",
          "nostalgia",
          "letters",
          "distance",
          "memory",
        ],
        color: "rose",
        source: "document",
        sourceRef: "love-poems-collection.pdf",
      },
      {
        name: "Ocean at Midnight",
        description:
          "The vast, dark, and mysterious expanse of the sea under moonlight.",
        keywords: ["ocean", "waves", "moonlight", "solitude", "depth"],
        color: "sky",
        source: "manual",
        sourceRef: "",
      },
      {
        name: "Urban Hustle",
        description:
          "The fast-paced, relentless energy of city life and ambition.",
        keywords: ["city", "grind", "ambition", "streets", "energy"],
        color: "amber",
        source: "manual",
        sourceRef: "",
      },
      {
        name: "Cosmic Journey",
        description:
          "An epic voyage through the stars, exploring the unknown.",
        keywords: ["space", "stars", "infinity", "wonder", "exploration"],
        color: "violet",
        source: "url",
        sourceRef: "https://www.nasa.gov/missions",
      },
      {
        name: "Autumn Melancholy",
        description:
          "The changing of seasons, reflection, and the quiet beauty of decay.",
        keywords: [
          "falling leaves",
          "rain",
          "change",
          "reflection",
          "warmth",
        ],
        color: "orange",
        source: "document",
        sourceRef: "seasonal-poetry.txt",
      },
    ])
    .returning();

  // Insert tracks
  const [t1, t2] = await db
    .insert(schema.tracks)
    .values([
      { name: "Neon Nights", genre: "Synthwave" },
      { name: "Fading Echoes", genre: "Indie Pop" },
    ])
    .returning();

  // Assign themes to tracks
  await db.insert(schema.trackThemes).values([
    { trackId: t1.id, themeId: th1.id },
    { trackId: t1.id, themeId: th4.id },
    { trackId: t2.id, themeId: th2.id },
    { trackId: t2.id, themeId: th6.id },
  ]);

  // Insert versions for track 1
  await db.insert(schema.trackVersions).values([
    {
      trackId: t1.id,
      versionNumber: 1,
      status: "complete",
      prompt:
        "A retro synthwave track with driving bassline and ethereal pads. 80s nostalgia.",
      negativePrompt: "vocals, acoustic instruments, slow",
      lyrics: "",
      style: {
        genre: "Electronic",
        moods: ["Energetic", "Dreamy"],
        tempo: 120,
        key: "A",
        isMinor: true,
        instruments: ["Synth", "Drums", "Bass"],
        vocalStyle: "None",
        duration: "3min",
        sunoApiVersion: "v3.5",
      },
      rating: 3,
      dimensionScores: {
        melody: 6,
        harmony: 7,
        rhythm: 8,
        production: 6,
        lyricsFit: 0,
        originality: 5,
        emotionalImpact: 6,
      },
      notes: "Good start, but the bass is a bit muddy.",
      feedback: {
        musicPositives: "The ethereal pads sound great.",
        musicNegatives: "Bass is muddy and lacks definition.",
        lyricsPositives: "",
        lyricsNegatives: "",
        thingsToAvoid: "Muddy low-end frequencies.",
      },
      isBest: false,
    },
    {
      trackId: t1.id,
      versionNumber: 2,
      status: "complete",
      prompt:
        "A retro synthwave track with driving bassline, punchy drums, and ethereal pads. 80s nostalgia, cyberpunk vibes.",
      negativePrompt: "vocals, acoustic instruments, slow, muddy bass",
      lyrics: "",
      style: {
        genre: "Electronic",
        moods: ["Energetic", "Dreamy", "Aggressive"],
        tempo: 125,
        key: "A",
        isMinor: true,
        instruments: ["Synth", "Drums", "Bass", "Pad"],
        vocalStyle: "None",
        duration: "3min",
        sunoApiVersion: "v4",
      },
      rating: 4,
      dimensionScores: {
        melody: 7,
        harmony: 8,
        rhythm: 9,
        production: 8,
        lyricsFit: 0,
        originality: 7,
        emotionalImpact: 8,
      },
      notes: "Much better! Add a lead synth melody in the bridge.",
      feedback: {
        musicPositives: "Punchy drums and clear bassline.",
        musicNegatives: "Missing a strong lead melody.",
        lyricsPositives: "",
        lyricsNegatives: "",
        thingsToAvoid: "Overpowering pads.",
      },
      isBest: true,
    },
  ]);

  // Insert versions for track 2
  await db.insert(schema.trackVersions).values([
    {
      trackId: t2.id,
      versionNumber: 1,
      status: "complete",
      prompt:
        "A melancholic indie pop song with acoustic guitar and soft female vocals.",
      negativePrompt: "heavy drums, electronic synths, aggressive",
      lyrics:
        "[Verse 1]\nWalking down this empty street\nShadows falling at my feet\n\n[Chorus]\nFading echoes in my mind\nLeaving all the past behind",
      style: {
        genre: "Pop",
        moods: ["Melancholic", "Chill"],
        tempo: 95,
        key: "E",
        isMinor: true,
        instruments: ["Guitar", "Vocals", "Bass", "Percussion"],
        vocalStyle: "Female",
        duration: "2min",
        sunoApiVersion: "v3.5",
      },
      rating: 4,
      dimensionScores: {
        melody: 8,
        harmony: 7,
        rhythm: 6,
        production: 7,
        lyricsFit: 8,
        originality: 6,
        emotionalImpact: 9,
      },
      notes: "Vocals are beautiful. The chorus needs more lift.",
      feedback: {
        musicPositives: "Acoustic guitar tone is perfect.",
        musicNegatives: "Chorus lacks energy.",
        lyricsPositives: "Good emotional resonance.",
        lyricsNegatives: "A bit cliché in the chorus.",
        thingsToAvoid: "Flat dynamics in the chorus.",
      },
      isBest: true,
    },
    {
      trackId: t2.id,
      versionNumber: 2,
      status: "draft",
      prompt:
        "A melancholic indie pop song with acoustic guitar, soft female vocals, and subtle strings in the chorus.",
      negativePrompt: "heavy drums, electronic synths, aggressive",
      lyrics:
        "[Verse 1]\nWalking down this empty street\nShadows falling at my feet\n\n[Chorus]\nFading echoes in my mind\nLeaving all the past behind\n(Oh, they fade away)",
      style: {
        genre: "Pop",
        moods: ["Melancholic", "Chill", "Romantic"],
        tempo: 95,
        key: "E",
        isMinor: true,
        instruments: ["Guitar", "Vocals", "Bass", "Percussion", "Strings"],
        vocalStyle: "Female",
        duration: "3min",
        sunoApiVersion: "v4",
      },
      rating: 0,
      dimensionScores: {
        melody: 0,
        harmony: 0,
        rhythm: 0,
        production: 0,
        lyricsFit: 0,
        originality: 0,
        emotionalImpact: 0,
      },
      notes: "",
      feedback: {
        musicPositives: "",
        musicNegatives: "",
        lyricsPositives: "",
        lyricsNegatives: "",
        thingsToAvoid: "",
      },
      isBest: false,
    },
  ]);

  console.log("Seed complete!");
  console.log(`- ${6} themes created`);
  console.log(`- ${2} tracks created`);
  console.log(`- ${4} versions created`);
}

seed().catch(console.error);
