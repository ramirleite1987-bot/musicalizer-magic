"use server";

import { generateText, Output } from "ai";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { chatMessages } from "@/lib/db/schema";
import type { ChatSuggestion } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Track, TrackVersion } from "@/types/music";

const responseSchema = z.object({
  message: z.string().describe("Conversational response to the user"),
  suggestions: z
    .array(
      z.object({
        type: z.enum(["prompt", "lyrics", "style_notes"]),
        content: z.string().describe("The full replacement content to apply"),
        description: z
          .string()
          .describe("Short one-line description of what this changes"),
      })
    )
    .optional()
    .describe(
      "Optional structured suggestions the user can apply with one click"
    ),
});

export interface ChatMessage {
  id: string;
  trackId: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: ChatSuggestion[];
  createdAt: string;
}

export async function getChatMessages(trackId: string): Promise<ChatMessage[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.trackId, trackId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    trackId: r.trackId,
    role: r.role as "user" | "assistant",
    content: r.content,
    suggestions: (r.suggestions as ChatSuggestion[]) ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function sendChatMessage(
  trackId: string,
  userMessage: string,
  context: {
    track: Pick<Track, "name" | "genre" | "tags">;
    version: Pick<
      TrackVersion,
      | "versionNumber"
      | "prompt"
      | "negativePrompt"
      | "lyrics"
      | "style"
      | "rating"
      | "dimensionScores"
      | "notes"
      | "feedback"
    >;
    history: ChatMessage[];
  }
): Promise<ChatMessage> {
  const db = getDb();

  // Persist user message
  await db
    .insert(chatMessages)
    .values({
      trackId,
      role: "user",
      content: userMessage,
    });

  // Build the system prompt with full track context
  const { track, version } = context;
  const dimScores = version.dimensionScores
    ? Object.entries(version.dimensionScores)
        .map(([k, v]) => `  ${k}: ${v}/10`)
        .join("\n")
    : "  (none)";

  const systemPrompt = `You are an expert music co-producer and creative collaborator working inside the Musicalizer Magic app.
You have full context of the track being worked on and can propose concrete changes.

## Current Track Context
Track: "${track.name}" (${track.genre})
Tags: ${track.tags.length > 0 ? track.tags.join(", ") : "(none)"}

### Version ${version.versionNumber}
Prompt:
"""
${version.prompt || "(empty)"}
"""

Negative Prompt:
"""
${version.negativePrompt || "(empty)"}
"""

Lyrics:
"""
${version.lyrics || "(empty)"}
"""

Style: ${version.style?.genre ?? "(unknown genre)"}, ${version.style?.moods?.join(", ") || ""}, ${version.style?.tempo ? version.style.tempo + " BPM" : ""}, key ${version.style?.key ?? "?"} ${version.style?.isMinor ? "minor" : "major"}
Instruments: ${version.style?.instruments?.join(", ") || "(none)"}
Vocal style: ${version.style?.vocalStyle || "(none)"}

Rating: ${version.rating}/5
Dimension Scores:
${dimScores}

Notes: ${version.notes || "(empty)"}
Feedback:
  Music positives: ${version.feedback?.musicPositives || "(empty)"}
  Music negatives: ${version.feedback?.musicNegatives || "(empty)"}
  Lyrics positives: ${version.feedback?.lyricsPositives || "(empty)"}
  Lyrics negatives: ${version.feedback?.lyricsNegatives || "(empty)"}
  Things to avoid: ${version.feedback?.thingsToAvoid || "(empty)"}

## Your Role
You are a knowledgeable and creative music producer. Help the user improve their track.
- Give concrete, actionable feedback
- When suggesting a rewrite of the prompt, lyrics, or style notes, include it as a structured suggestion with type "prompt", "lyrics", or "style_notes"
- Suggestions must include the FULL replacement content (not just the diff)
- Keep your conversational message concise (2-4 paragraphs max)
- Be encouraging and creative, but honest about weaknesses`;

  // Build message history for context (last 20 messages)
  const recentHistory = context.history.slice(-20);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: responseSchema }),
    system: systemPrompt,
    messages,
  });

  const assistantContent = output?.message ?? "I had trouble generating a response. Please try again.";
  const suggestions = (output?.suggestions as ChatSuggestion[] | undefined) ?? undefined;

  const [savedAssistant] = await db
    .insert(chatMessages)
    .values({
      trackId,
      role: "assistant",
      content: assistantContent,
      suggestions: suggestions ?? null,
    })
    .returning();

  return {
    id: savedAssistant.id,
    trackId: savedAssistant.trackId,
    role: "assistant",
    content: assistantContent,
    suggestions,
    createdAt: savedAssistant.createdAt.toISOString(),
  };
}

export async function clearChatHistory(trackId: string): Promise<void> {
  const db = getDb();
  await db.delete(chatMessages).where(eq(chatMessages.trackId, trackId));
}
