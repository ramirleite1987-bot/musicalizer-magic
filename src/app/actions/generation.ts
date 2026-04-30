"use server";

import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MusicProvider } from "@/types/music";
import { createGeneration, resolveProvider } from "@/lib/music";
import {
  InvalidTrackStyleError,
  validateForGeneration,
} from "@/lib/music/validation";
import { revalidatePath } from "next/cache";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type StartGenerationResult =
  | { ok: true; taskId: string; provider: MusicProvider }
  | { ok: false; error: string; issues?: ValidationIssue[] };

export async function startGeneration(
  versionId: string
): Promise<StartGenerationResult> {
  const db = getDb();

  const [version] = await db
    .select()
    .from(trackVersions)
    .where(eq(trackVersions.id, versionId))
    .limit(1);

  if (!version) return { ok: false, error: "Version not found" };
  if (version.status === "generating")
    return { ok: false, error: "Already generating" };

  try {
    validateForGeneration(version.style);
  } catch (e) {
    if (e instanceof InvalidTrackStyleError) {
      return {
        ok: false,
        error: "Track style failed validation",
        issues: e.issues.map((i) => ({
          path: i.path.join(".") || "<root>",
          message: i.message,
        })),
      };
    }
    throw e;
  }

  const provider = resolveProvider(version.style);

  const result = await createGeneration({
    prompt: version.prompt,
    negativePrompt: version.negativePrompt,
    lyrics: version.lyrics,
    style: version.style,
  });

  await db
    .update(trackVersions)
    .set({
      status: "generating",
      provider,
      providerTaskId: result.taskId,
      sunoTaskId: provider === "suno" ? result.taskId : null,
      updatedAt: new Date(),
    })
    .where(eq(trackVersions.id, versionId));

  revalidatePath("/dashboard");

  return { ok: true, taskId: result.taskId, provider };
}
