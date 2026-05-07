"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import type { TrackStyle, DimensionScores, TrackFeedback } from "@/types/music";

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
