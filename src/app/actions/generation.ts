"use server";

import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createGeneration } from "@/lib/suno/client";
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
      sunoTaskId: result.taskId,
      updatedAt: new Date(),
    })
    .where(eq(trackVersions.id, versionId));

  revalidatePath("/dashboard");

  return { taskId: result.taskId };
}
