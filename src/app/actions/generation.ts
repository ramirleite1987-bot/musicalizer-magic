"use server";

import { revalidatePath } from "next/cache";
import { startVersionGeneration } from "@/lib/music/song-workflow";

export async function startGeneration(versionId: string) {
  const result = await startVersionGeneration(versionId);
  revalidatePath("/dashboard");
  return result;
}
