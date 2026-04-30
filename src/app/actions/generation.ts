"use server";

import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGeneration, resolveProvider } from "@/lib/music";
import { validateForGeneration } from "@/lib/music/validation";
import { revalidatePath } from "next/cache";

export async function startGeneration(versionId: string) {
  const db = getDb();

  const [version] = await db
    .select()
    .from(trackVersions)
    .where(eq(trackVersions.id, versionId))
    .limit(1);

  if (!version) throw new Error("Version not found");
  if (version.status === "generating") throw new Error("Already generating");

  validateForGeneration(version.style);

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

  return { taskId: result.taskId, provider };
}
