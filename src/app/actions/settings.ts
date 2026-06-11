"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { requireUserId, ensureUserSettings } from "@/lib/auth";
import { encryptSecret, maskKey } from "@/lib/crypto";
import { safeDecrypt } from "@/lib/user-config";

export type ApiKeyProvider = "openrouter" | "minimax" | "suno";

export interface SettingsView {
  llmProvider: string;
  llmModel: string;
  defaultMusicProvider: string;
  defaultGenre: string;
  /** Masked previews of stored keys (null = not configured) */
  keys: Record<ApiKeyProvider, string | null>;
}

function maskStored(encrypted: string | null): string | null {
  if (!encrypted) return null;
  const plain = safeDecrypt(encrypted);
  // Key exists but can't be decrypted (e.g. APP_ENCRYPTION_KEY rotated)
  return plain ? maskKey(plain) : "configured (re-enter to update)";
}

export async function getSettings(): Promise<SettingsView> {
  const userId = await requireUserId();
  const row = await ensureUserSettings(userId);

  return {
    llmProvider: row.llmProvider,
    llmModel: row.llmModel ?? "",
    defaultMusicProvider: row.defaultMusicProvider,
    defaultGenre: row.defaultGenre ?? "",
    keys: {
      openrouter: maskStored(row.openrouterKeyEnc),
      minimax: maskStored(row.minimaxKeyEnc),
      suno: maskStored(row.sunoKeyEnc),
    },
  };
}

export async function updateSettings(data: {
  llmProvider?: string;
  llmModel?: string;
  defaultMusicProvider?: string;
  defaultGenre?: string;
}): Promise<void> {
  const userId = await requireUserId();
  await ensureUserSettings(userId);
  const db = getDb();

  await db
    .update(userSettings)
    .set({
      ...(data.llmProvider !== undefined ? { llmProvider: data.llmProvider } : {}),
      ...(data.llmModel !== undefined ? { llmModel: data.llmModel || null } : {}),
      ...(data.defaultMusicProvider !== undefined
        ? { defaultMusicProvider: data.defaultMusicProvider }
        : {}),
      ...(data.defaultGenre !== undefined
        ? { defaultGenre: data.defaultGenre || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  revalidatePath("/settings");
}

const KEY_COLUMNS: Record<ApiKeyProvider, "openrouterKeyEnc" | "minimaxKeyEnc" | "sunoKeyEnc"> = {
  openrouter: "openrouterKeyEnc",
  minimax: "minimaxKeyEnc",
  suno: "sunoKeyEnc",
};

/** Stores (or clears, when `key` is empty) an API key, encrypted at rest. */
export async function setApiKey(
  provider: ApiKeyProvider,
  key: string
): Promise<void> {
  const userId = await requireUserId();
  await ensureUserSettings(userId);
  const db = getDb();

  const column = KEY_COLUMNS[provider];
  if (!column) throw new Error(`Unknown provider: ${provider}`);

  const trimmed = key.trim();
  await db
    .update(userSettings)
    .set({
      [column]: trimmed ? encryptSecret(trimmed) : null,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  revalidatePath("/settings");
}
