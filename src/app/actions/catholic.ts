"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { tracks, trackVersions, themes, trackThemes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  DEFAULT_DIMENSION_SCORES,
  DEFAULT_FEEDBACK,
} from "@/lib/version-defaults";
import {
  getCatholicTheme,
  getCatholicStyleBlend,
  buildCatholicStyle,
  type CatholicThemeId,
} from "@/data/catholic-presets";
import { songLanguageName } from "@/lib/music/language";
import type { SongLanguage } from "@/types/music";

export interface CatholicCompositionInput {
  themeId: CatholicThemeId;
  blends: string[];
  keywords: string[];
  inspiration: string[];
  language: SongLanguage;
  instrumental: boolean;
}

export interface CatholicComposition {
  suggestedName: string;
  prompt: string;
  negativePrompt: string;
  lyrics: string;
}

const compositionSchema = z.object({
  suggestedName: z
    .string()
    .max(60)
    .describe("A short, evocative title for the song in the requested language"),
  prompt: z
    .string()
    .describe(
      "A vivid music-generation prompt (English) describing genre, mood, instrumentation and arrangement"
    ),
  negativePrompt: z
    .string()
    .describe("Comma-separated elements to avoid"),
  lyrics: z
    .string()
    .describe(
      "Full lyrics with [Verse]/[Chorus] section labels, written in the requested language. Empty string when instrumental."
    ),
});

function blendDescriptors(blendIds: string[]): string[] {
  return blendIds
    .map((id) => getCatholicStyleBlend(id)?.descriptor)
    .filter((d): d is string => Boolean(d));
}

export async function buildCatholicComposition(
  input: CatholicCompositionInput
): Promise<CatholicComposition> {
  const theme = getCatholicTheme(input.themeId);
  if (!theme) {
    throw new Error(`Unknown catholic theme: ${input.themeId}`);
  }

  const languageName = songLanguageName(input.language);
  const descriptors = blendDescriptors(input.blends);
  const allKeywords = [...theme.keywords, ...input.keywords].filter(Boolean);
  const inspiration = input.inspiration.filter((s) => s.trim());

  const userPrompt = `You are a Catholic music director and songwriter creating an original, doctrinally respectful worship song.

Theme: ${theme.canonicalName}
Theme brief: ${theme.brief}

Devotional keywords / nuances to weave in: ${allKeywords.join(", ") || "(none)"}

Musical style blend: ${
    descriptors.length > 0 ? descriptors.join("; ") : "tasteful contemporary worship arrangement"
  }

${
  inspiration.length > 0
    ? `Songs/artists for inspiration (match the vibe and energy, DO NOT copy melodies or lyrics):\n${inspiration
        .map((s) => `- ${s}`)
        .join("\n")}`
    : "No specific inspiration songs provided."
}

Target sung language: ${languageName}
${input.instrumental ? "This track is INSTRUMENTAL — return an empty string for lyrics." : ""}

Produce:
1. suggestedName: a short, singable title in ${languageName}.
2. prompt: a vivid English music-generation prompt describing the genre/blend, mood, tempo feel, instrumentation and vocal arrangement. Make the requested style blend clearly audible.
3. negativePrompt: comma-separated things to avoid (e.g. anything irreverent, off-theme, dissonant).
4. lyrics: ${
    input.instrumental
      ? "an empty string."
      : `complete, original, reverent lyrics in ${languageName} with [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro] section labels (labels stay in English). Keep the message theologically sound for the Catholic tradition.`
  }`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: compositionSchema }),
    prompt: userPrompt,
  });

  return {
    suggestedName: output?.suggestedName ?? theme.canonicalName,
    prompt: output?.prompt ?? "",
    negativePrompt: output?.negativePrompt ?? "",
    lyrics: input.instrumental ? "" : output?.lyrics ?? "",
  };
}

// Ensure the seeded theme row exists (idempotent by name) and return its id.
async function ensureCatholicTheme(
  db: ReturnType<typeof getDb>,
  themeId: CatholicThemeId
): Promise<string | null> {
  const theme = getCatholicTheme(themeId);
  if (!theme) return null;

  const existing = await db.query.themes.findFirst({
    where: eq(themes.name, theme.canonicalName),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(themes)
    .values({
      name: theme.canonicalName,
      description: theme.canonicalDescription,
      keywords: theme.keywords,
      color: theme.color,
      source: "manual",
      sourceRef: "",
    })
    .returning();
  return created.id;
}

export interface CreateCatholicTrackInput {
  themeId: CatholicThemeId;
  name: string;
  prompt: string;
  negativePrompt: string;
  lyrics: string;
  language: SongLanguage;
  instrumental: boolean;
}

export async function createCatholicTrack(
  input: CreateCatholicTrackInput
): Promise<string> {
  const db = getDb();
  const theme = getCatholicTheme(input.themeId);
  if (!theme) {
    throw new Error(`Unknown catholic theme: ${input.themeId}`);
  }

  const style = buildCatholicStyle(
    input.themeId,
    input.language,
    input.instrumental
  );

  const [track] = await db
    .insert(tracks)
    .values({
      name: input.name.trim() || theme.canonicalName,
      genre: style.genre,
      tags: ["católico", theme.canonicalName.toLowerCase()],
    })
    .returning();

  await db.insert(trackVersions).values({
    trackId: track.id,
    versionNumber: 1,
    status: "draft",
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    lyrics: input.instrumental ? "" : input.lyrics,
    style,
    rating: 0,
    dimensionScores: DEFAULT_DIMENSION_SCORES,
    notes: "",
    feedback: DEFAULT_FEEDBACK,
    isBest: false,
    audioFileName: null,
    audioUrl: null,
    sunoTaskId: null,
    provider: "suno",
    providerTaskId: null,
  });

  const themeRowId = await ensureCatholicTheme(db, input.themeId);
  if (themeRowId) {
    await db
      .insert(trackThemes)
      .values({ trackId: track.id, themeId: themeRowId })
      .onConflictDoNothing();
  }

  revalidatePath("/dashboard");
  return track.id;
}
