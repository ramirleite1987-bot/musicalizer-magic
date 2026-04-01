import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";

const themeSchema = z.object({
  themes: z.array(
    z.object({
      name: z.string().describe("A short evocative name for the theme"),
      description: z
        .string()
        .describe("A 1-2 sentence description of the theme"),
      keywords: z
        .array(z.string())
        .min(3)
        .max(5)
        .describe("Keywords that capture the theme"),
      suggestedColor: z
        .enum(["violet", "emerald", "amber", "rose", "sky", "orange"])
        .describe("A color that fits the theme mood"),
    })
  ),
});

export async function POST(request: Request) {
  const { source, content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  let textToAnalyze = content;

  if (source === "url") {
    try {
      const res = await fetch(content);
      const html = await res.text();
      // Strip HTML tags for a rough text extraction
      textToAnalyze = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch URL content" },
        { status: 400 }
      );
    }
  }

  try {
    const { output } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      output: Output.object({ schema: themeSchema }),
      prompt: `You are a creative music producer's assistant. Analyze the following text and extract 3 distinct thematic inspirations that could guide music composition. Each theme should capture a different emotional or conceptual angle from the source material.

Focus on:
- Emotional undertones and moods
- Visual imagery and atmosphere
- Narrative arcs or tensions
- Abstract concepts that translate well to music

Source text:
${textToAnalyze.slice(0, 4000)}`,
    });

    const themes = (output?.themes ?? []).map((t) => ({
      name: t.name,
      description: t.description,
      keywords: t.keywords,
      color: t.suggestedColor,
      source,
      sourceRef: source === "url" ? content : "Pasted Document",
    }));

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("AI theme generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate themes" },
      { status: 500 }
    );
  }
}
