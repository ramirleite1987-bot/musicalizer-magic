"use server";

import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { stylePresets } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import type { TrackStyle } from "@/types/music";

export type StylePreset = {
  id: string;
  name: string;
  style: TrackStyle;
  createdAt: string;
};

export async function getStylePresets(): Promise<StylePreset[]> {
  const userId = await requireUserId();
  const db = getDb();
  const rows = await db
    .select()
    .from(stylePresets)
    .where(eq(stylePresets.userId, userId))
    .orderBy(asc(stylePresets.createdAt));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    style: row.style,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function saveStylePreset(
  name: string,
  style: TrackStyle
): Promise<void> {
  const userId = await requireUserId();
  const db = getDb();
  await db.insert(stylePresets).values({ userId, name, style });
}

export async function deleteStylePreset(id: string): Promise<void> {
  const userId = await requireUserId();
  const db = getDb();
  await db
    .delete(stylePresets)
    .where(and(eq(stylePresets.id, id), eq(stylePresets.userId, userId)));
}
