"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { themes, trackThemes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { requireOwnedTrack } from "@/lib/db/ownership";
import type { Theme } from "@/types/music";

async function requireOwnedTheme(themeId: string, userId: string) {
  const db = getDb();
  const [theme] = await db
    .select()
    .from(themes)
    .where(and(eq(themes.id, themeId), eq(themes.userId, userId)))
    .limit(1);
  if (!theme) {
    throw new Error("Theme not found");
  }
  return theme;
}

export async function getThemes(): Promise<Theme[]> {
  const userId = await requireUserId();
  const db = getDb();

  const rows = await db.query.themes.findMany({
    where: eq(themes.userId, userId),
  });

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
  const userId = await requireUserId();
  const db = getDb();

  await db.insert(themes).values({
    userId,
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
  const userId = await requireUserId();
  const db = getDb();
  await db
    .delete(themes)
    .where(and(eq(themes.id, id), eq(themes.userId, userId)));
  revalidatePath("/dashboard");
}

export async function assignTheme(trackId: string, themeId: string) {
  const userId = await requireUserId();
  const db = getDb();

  await requireOwnedTrack(trackId, userId);
  await requireOwnedTheme(themeId, userId);

  // Insert, ignore if already exists
  await db
    .insert(trackThemes)
    .values({ trackId, themeId })
    .onConflictDoNothing();

  revalidatePath("/dashboard");
}

export async function removeTheme(trackId: string, themeId: string) {
  const userId = await requireUserId();
  const db = getDb();

  await requireOwnedTrack(trackId, userId);

  await db
    .delete(trackThemes)
    .where(
      and(eq(trackThemes.trackId, trackId), eq(trackThemes.themeId, themeId))
    );

  revalidatePath("/dashboard");
}
