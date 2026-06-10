"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import type { TrackStyle, DimensionScores, TrackFeedback } from "@/types/music";

const lyricsSchema = z.object({
  lyrics: z.string().describe("The full lyrics with section labels like [Verse 1], [Chorus], [Bridge]"),
  structure: z.string().describe("A short description of the song structure that was generated"),
});

export async function generateLyrics(params: {
  trackName: string;
  prompt: string;
  genre: string;
  moods: string[];
  style: Partial<TrackStyle>;
  existingLyrics?: string;
}): Promise<{ lyrics: string; structure: string }> {
  const { trackName, prompt, genre, moods, style, existingLyrics } = params;

  const styleDescription = [
    genre ? `Genre: ${genre}` : null,
    moods && moods.length > 0 ? `Moods/Vibes: ${moods.join(", ")}` : null,
    style.tempo ? `Tempo: ${style.tempo} BPM` : null,
    style.key ? `Key: ${style.key} ${style.isMinor ? "minor" : "major"}` : null,
    style.vocalStyle ? `Vocal style: ${style.vocalStyle}` : null,
    style.instruments && style.instruments.length > 0
      ? `Instruments: ${style.instruments.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const existingLyricsSection = existingLyrics
    ? `\nExisting lyrics to improve/expand upon:\n"""\n${existingLyrics}\n"""\n`
    : "";

  const userPrompt = `You are an expert lyricist. Generate complete, original lyrics for a ${genre || "music"} track called "${trackName}".

Musical direction:
"""
${prompt || "(no specific direction provided)"}
"""

Style details:
${styleDescription || "(no additional style details)"}
${existingLyricsSection}
Requirements:
- Use clear section labels: [Verse 1], [Pre-Chorus] (optional), [Chorus], [Verse 2], [Bridge], [Outro] as appropriate
- Make the lyrics thematically consistent and emotionally resonant
- Match the tone and energy implied by the genre and moods
- The chorus should be catchy and memorable
- Aim for a complete song structure (at minimum: verse, chorus, verse, chorus, bridge, chorus)
- Each section label must be on its own line, e.g. "[Verse 1]" then the lyrics below it
${existingLyrics ? "- Improve and expand on the existing lyrics while keeping the best parts" : ""}

Return the full lyrics with all section labels included.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: lyricsSchema }),
    prompt: userPrompt,
  });

  return {
    lyrics: output?.lyrics ?? "",
    structure: output?.structure ?? "verse/chorus/bridge structure",
  };
}

const trackNamesSchema = z.object({
  names: z
    .array(z.string().max(50))
    .length(3),
});

export async function generateTrackNames(params: {
  prompt: string;
  negativePrompt?: string;
  style: Partial<TrackStyle>;
  genre?: string;
}): Promise<string[]> {
  const { prompt, style, genre } = params;

  const styleDescription = [
    genre ? `Genre: ${genre}` : style.genre ? `Genre: ${style.genre}` : null,
    style.moods && style.moods.length > 0 ? `Moods: ${style.moods.join(", ")}` : null,
    style.tempo ? `Tempo: ${style.tempo} BPM` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `You are a creative music producer assistant. Generate 3 short, evocative, and memorable track names based on the following music details.

Prompt / description:
"""
${prompt || "(no prompt provided)"}
"""

${styleDescription ? `Style:\n${styleDescription}` : ""}

Return exactly 3 track names. Each name should be concise (max 50 characters), creative, and capture the essence of the music. Do not include numbers, quotes, or extra explanation — just the names.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: trackNamesSchema }),
    prompt: userPrompt,
  });

  return output?.names ?? [];
}

const suggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().describe("A short title summarising the improvement"),
        suggestion: z
          .string()
          .describe("1-2 sentences explaining why this change would help"),
        improvedPrompt: z
          .string()
          .describe("The full revised prompt text incorporating this suggestion"),
      })
    )
    .length(3),
});

export interface PromptSuggestion {
  title: string;
  suggestion: string;
  improvedPrompt: string;
}

const autoEvaluateSchema = z.object({
  melody: z.number().min(1).max(10),
  harmony: z.number().min(1).max(10),
  rhythm: z.number().min(1).max(10),
  production: z.number().min(1).max(10),
  lyricsFit: z.number().min(1).max(10),
  originality: z.number().min(1).max(10),
  emotionalImpact: z.number().min(1).max(10),
  justifications: z.record(z.string(), z.string()),
  overallNotes: z.string(),
});

export async function autoEvaluate(params: {
  prompt: string;
  negativePrompt: string;
  lyrics: string;
  style: TrackStyle;
  trackName: string;
}): Promise<{
  scores: DimensionScores;
  justifications: Record<string, string>;
  overallNotes: string;
}> {
  const { prompt, negativePrompt, lyrics, style, trackName } = params;

  const styleDescription = [
    style.genre ? `Genre: ${style.genre}` : null,
    style.moods && style.moods.length > 0 ? `Moods: ${style.moods.join(", ")}` : null,
    style.tempo ? `Tempo: ${style.tempo} BPM` : null,
    style.key ? `Key: ${style.key} ${style.isMinor ? "minor" : "major"}` : null,
    style.vocalStyle ? `Vocal style: ${style.vocalStyle}` : null,
    style.instruments && style.instruments.length > 0
      ? `Instruments: ${style.instruments.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `You are a professional music producer and critic. Analyze this track and provide scores (1-10) for each dimension with a one-sentence justification.

Track name: "${trackName}"

Prompt / creative direction:
"""
${prompt || "(no prompt provided)"}
"""

Negative prompt:
"""
${negativePrompt || "(none)"}
"""

Style:
${styleDescription || "(no style details)"}

Lyrics:
"""
${lyrics || "(no lyrics provided)"}
"""

Evaluate each dimension honestly on a 1-10 scale:
- melody: melodic quality, catchiness, and memorability
- harmony: chord progressions, harmonic richness, and tonal coherence
- rhythm: rhythmic drive, groove, and timing
- production: sonic quality, mixing, arrangement, and sound design
- lyricsFit: how well the lyrics match the musical style and emotional tone
- originality: uniqueness, creativity, and distinctiveness
- emotionalImpact: emotional resonance, feeling conveyed, and listener engagement

For each dimension, provide a one-sentence justification in the "justifications" field (keyed by dimension name).
Also provide a brief overallNotes summary (2-3 sentences) covering the track's main strengths and areas for improvement.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: autoEvaluateSchema }),
    prompt: userPrompt,
  });

  const scores: DimensionScores = {
    melody: output?.melody ?? 5,
    harmony: output?.harmony ?? 5,
    rhythm: output?.rhythm ?? 5,
    production: output?.production ?? 5,
    lyricsFit: output?.lyricsFit ?? 5,
    originality: output?.originality ?? 5,
    emotionalImpact: output?.emotionalImpact ?? 5,
  };

  return {
    scores,
    justifications: (output?.justifications ?? {}) as Record<string, string>,
    overallNotes: output?.overallNotes ?? "",
  };
}

export async function suggestPromptImprovements(params: {
  prompt: string;
  negativePrompt: string;
  style: TrackStyle;
  dimensionScores: DimensionScores;
  feedback: TrackFeedback;
  rating: number;
}): Promise<PromptSuggestion[]> {
  const { prompt, negativePrompt, style, dimensionScores, feedback, rating } =
    params;

  const styleDescription = [
    `Genre: ${style.genre}`,
    style.moods.length > 0 ? `Moods: ${style.moods.join(", ")}` : null,
    `Tempo: ${style.tempo} BPM`,
    `Key: ${style.key} ${style.isMinor ? "minor" : "major"}`,
    style.instruments.length > 0
      ? `Instruments: ${style.instruments.join(", ")}`
      : null,
    `Vocal style: ${style.vocalStyle}`,
    `Duration: ${style.duration}`,
  ]
    .filter(Boolean)
    .join("\n");

  const scoreSummary = Object.entries(dimensionScores)
    .map(([k, v]) => `${k}: ${v}/10`)
    .join(", ");

  const feedbackSummary = [
    feedback.musicPositives
      ? `Music positives: ${feedback.musicPositives}`
      : null,
    feedback.musicNegatives
      ? `Music negatives: ${feedback.musicNegatives}`
      : null,
    feedback.lyricsPositives
      ? `Lyrics positives: ${feedback.lyricsPositives}`
      : null,
    feedback.lyricsNegatives
      ? `Lyrics negatives: ${feedback.lyricsNegatives}`
      : null,
    feedback.thingsToAvoid
      ? `Things to avoid: ${feedback.thingsToAvoid}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `You are an expert AI music production assistant. Your task is to analyze a music generation prompt and suggest concrete improvements.

Current prompt:
"""
${prompt || "(empty)"}
"""

Negative prompt:
"""
${negativePrompt || "(none)"}
"""

Style settings:
${styleDescription}

Overall rating: ${rating}/10

Dimension scores (each out of 10):
${scoreSummary}

User feedback:
${feedbackSummary || "(none provided)"}

Based on the above information, provide exactly 3 concrete, actionable suggestions to improve the prompt. Each suggestion should address a specific weakness (low score, negative feedback, or missing detail) and include a fully rewritten improved prompt incorporating that change.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: suggestionSchema }),
    prompt: userPrompt,
  });

  return output?.suggestions ?? [];
}
