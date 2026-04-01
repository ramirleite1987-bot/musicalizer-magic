"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { themes, trackThemes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Theme } from "@/types/music";

export async function getThemes(): Promise<Theme[]> {
  const db = getDb();

  const rows = await db.query.themes.findMany();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    keywords: row.keywords,
    color: row.color,
    source: row.source,
    sourceRef: row.sourceRef,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createTheme(data: Omit<Theme, "id" | "createdAt">) {
  const db = getDb();

  await db.insert(themes).values({
    name: data.name,
    description: data.description,
    keywords: data.keywords,
    color: data.color,
    source: data.source,
    sourceRef: data.sourceRef,
  });

  revalidatePath("/dashboard");
}

export async function deleteTheme(id: string) {
  const db = getDb();
  await db.delete(themes).where(eq(themes.id, id));
  revalidatePath("/dashboard");
}

export async function assignTheme(trackId: string, themeId: string) {
  const db = getDb();

  // Insert, ignore if already exists
  await db
    .insert(trackThemes)
    .values({ trackId, themeId })
    .onConflictDoNothing();

  revalidatePath("/dashboard");
}

export async function removeTheme(trackId: string, themeId: string) {
  const db = getDb();

  await db
    .delete(trackThemes)
    .where(
      and(eq(trackThemes.trackId, trackId), eq(trackThemes.themeId, themeId))
    );

  revalidatePath("/dashboard");
}
