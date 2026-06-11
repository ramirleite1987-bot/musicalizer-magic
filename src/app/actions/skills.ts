"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { requireUserId } from "@/lib/auth";
import { DEFAULT_SKILLS, type SkillDefinition } from "@/data/default-skills";

export type { SkillDefinition };

const CATEGORIES = ["lyrics", "prompt", "general"] as const;

function normalizeCategory(value: string): SkillDefinition["category"] {
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as SkillDefinition["category"])
    : "general";
}

/** Built-in skills plus the current user's custom skills. */
export async function getAllSkills(): Promise<SkillDefinition[]> {
  const userId = await requireUserId();
  const db = getDb();

  const rows = await db
    .select()
    .from(skills)
    .where(eq(skills.userId, userId))
    .orderBy(asc(skills.createdAt));

  const userSkills: SkillDefinition[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: normalizeCategory(row.category),
    instructions: row.instructions,
    builtin: false,
  }));

  return [...DEFAULT_SKILLS, ...userSkills];
}

export async function createSkill(data: {
  name: string;
  description: string;
  category: string;
  instructions: string;
}): Promise<void> {
  const userId = await requireUserId();
  if (!data.name.trim()) throw new Error("Skill name is required");
  if (!data.instructions.trim()) throw new Error("Skill instructions are required");

  const db = getDb();
  await db.insert(skills).values({
    userId,
    name: data.name.trim(),
    description: data.description.trim(),
    category: normalizeCategory(data.category),
    instructions: data.instructions.trim(),
  });

  revalidatePath("/skills");
}

export async function updateSkill(
  id: string,
  data: {
    name?: string;
    description?: string;
    category?: string;
    instructions?: string;
  }
): Promise<void> {
  const userId = await requireUserId();
  const db = getDb();

  await db
    .update(skills)
    .set({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description.trim() }
        : {}),
      ...(data.category !== undefined
        ? { category: normalizeCategory(data.category) }
        : {}),
      ...(data.instructions !== undefined
        ? { instructions: data.instructions.trim() }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(skills.id, id), eq(skills.userId, userId)));

  revalidatePath("/skills");
}

export async function deleteSkill(id: string): Promise<void> {
  const userId = await requireUserId();
  const db = getDb();
  await db
    .delete(skills)
    .where(and(eq(skills.id, id), eq(skills.userId, userId)));
  revalidatePath("/skills");
}
