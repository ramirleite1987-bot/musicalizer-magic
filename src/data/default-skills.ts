export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: "lyrics" | "prompt" | "general";
  instructions: string;
  builtin: boolean;
}

/**
 * Built-in skills available to every user. User-created skills (stored in the
 * `skills` table) appear alongside these in the library.
 */
export const DEFAULT_SKILLS: SkillDefinition[] = [
  {
    id: "builtin-hook-first-chorus",
    name: "Hook-first chorus",
    description: "Leads with an instantly memorable chorus hook.",
    category: "lyrics",
    instructions:
      "Open the chorus with the strongest, most repeatable hook line. Keep the hook under 8 words, repeat it at least twice per chorus, and make it singable on first listen.",
    builtin: true,
  },
  {
    id: "builtin-storytelling-verses",
    name: "Storytelling verses",
    description: "Verses that advance a clear narrative arc.",
    category: "lyrics",
    instructions:
      "Write verses as a story with a protagonist, concrete scenes, and sensory details. Verse 1 sets the scene, verse 2 raises the stakes, and the bridge delivers the turning point or revelation.",
    builtin: true,
  },
  {
    id: "builtin-imagery-over-abstraction",
    name: "Imagery over abstraction",
    description: "Concrete images instead of abstract feelings.",
    category: "lyrics",
    instructions:
      "Replace abstract emotional statements with concrete, visual imagery. Instead of naming feelings ('I'm sad'), show them through objects, places, weather, and actions the listener can picture.",
    builtin: true,
  },
  {
    id: "builtin-rhyme-discipline",
    name: "Rhyme discipline",
    description: "Tight rhyme schemes without forced rhymes.",
    category: "lyrics",
    instructions:
      "Maintain a consistent rhyme scheme (e.g. ABAB or AABB) per section, favor internal and slant rhymes over forced perfect rhymes, and never sacrifice natural phrasing for a rhyme.",
    builtin: true,
  },
  {
    id: "builtin-minimal-repetition",
    name: "Minimal repetition",
    description: "Every line earns its place; no filler.",
    category: "lyrics",
    instructions:
      "Avoid filler lines and redundant restatements. Outside the chorus, no line should repeat an idea already expressed; each line must add new information, imagery, or emotional progression.",
    builtin: true,
  },
  {
    id: "builtin-prompt-detailer",
    name: "Production detailer",
    description: "Adds texture, dynamics, and mix details to prompts.",
    category: "prompt",
    instructions:
      "Enrich the creative direction with concrete production details: instrument textures, dynamic arc (build-ups, drops, breakdowns), spatial mix notes (wide pads, dry vocals), and a clear energy curve from intro to outro.",
    builtin: true,
  },
];
