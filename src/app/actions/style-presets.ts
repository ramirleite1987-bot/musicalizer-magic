"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, asc } from "drizzle-orm";
import { stylePresets } from "@/lib/db/schema";
import type { TrackStyle } from "@/types/music";

export type StylePreset = {
  id: string;
  name: string;
  style: TrackStyle;
  createdAt: string;
};

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema: { stylePresets } });
}

export async function getStylePresets(): Promise<StylePreset[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(stylePresets)
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
  const db = getDb();
  await db.insert(stylePresets).values({ name, style });
}

export async function deleteStylePreset(id: string): Promise<void> {
  const db = getDb();
  await db.delete(stylePresets).where(eq(stylePresets.id, id));
}
