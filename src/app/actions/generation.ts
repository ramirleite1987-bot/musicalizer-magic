"use server";

import { getDb } from "@/lib/db";
import { trackVersions, generationLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGeneration, resolveProvider } from "@/lib/music";
import { validateForGeneration } from "@/lib/music/validation";
import { requireUserId } from "@/lib/auth";
import { requireOwnedVersion } from "@/lib/db/ownership";
import { getUserMusicKeys } from "@/lib/user-config";
import { revalidatePath } from "next/cache";

export async function startGeneration(versionId: string) {
  const userId = await requireUserId();
  const db = getDb();

  const version = await requireOwnedVersion(versionId, userId);

  if (version.status === "generating") throw new Error("Already generating");

  validateForGeneration(version.style);

  const provider = resolveProvider(version.style);
  const keys = await getUserMusicKeys(userId);

  const result = await createGeneration(
    {
      prompt: version.prompt,
      negativePrompt: version.negativePrompt,
      lyrics: version.lyrics,
      style: version.style,
    },
    keys
  );

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

  // Log the generation start
  try {
    const model =
      provider === "minimax"
        ? (version.style as { minimaxModel?: string })?.minimaxModel ?? "music-1.5"
        : (version.style as { sunoApiVersion?: string })?.sunoApiVersion ?? "v4";
    await db.insert(generationLogs).values({
      userId,
      trackId: version.trackId,
      versionId,
      provider,
      model,
      status: "started",
    });
  } catch {
    // Non-fatal
  }

  revalidatePath("/dashboard");

  return { taskId: result.taskId, provider };
}
