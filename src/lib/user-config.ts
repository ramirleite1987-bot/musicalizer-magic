import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { decryptSecret } from "@/lib/crypto";

// Used via the Vercel AI Gateway when the user hasn't configured their own LLM key
export const DEFAULT_GATEWAY_MODEL = "anthropic/claude-sonnet-4.6";
export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-sonnet-4.5";
export const DEFAULT_MINIMAX_LLM_MODEL = "MiniMax-M2";

export type UserSettingsRow = typeof userSettings.$inferSelect;

export async function getUserSettingsRow(
  userId: string
): Promise<UserSettingsRow | null> {
  const db = getDb();
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  return row ?? null;
}

/** Decrypts a stored key, returning null if missing or undecryptable (e.g. rotated APP_ENCRYPTION_KEY). */
export function safeDecrypt(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  try {
    return decryptSecret(encrypted);
  } catch {
    return null;
  }
}

/**
 * Resolves the LLM to use for AI features. Prefers the user's own provider/key
 * from /settings (OpenRouter or Minimax); falls back to the server's gateway
 * default when none is configured.
 */
export async function getUserModel(): Promise<LanguageModel> {
  const { userId } = await auth();
  if (!userId) return DEFAULT_GATEWAY_MODEL;

  const row = await getUserSettingsRow(userId);
  if (!row) return DEFAULT_GATEWAY_MODEL;

  if (row.llmProvider === "minimax") {
    const apiKey = safeDecrypt(row.minimaxKeyEnc);
    if (apiKey) {
      const minimax = createOpenAICompatible({
        name: "minimax",
        baseURL: process.env.MINIMAX_API_BASE_URL ?? "https://api.minimaxi.chat/v1",
        apiKey,
      });
      return minimax.chatModel(row.llmModel || DEFAULT_MINIMAX_LLM_MODEL);
    }
  } else {
    const apiKey = safeDecrypt(row.openrouterKeyEnc);
    if (apiKey) {
      const openrouter = createOpenRouter({ apiKey });
      return openrouter.chat(row.llmModel || DEFAULT_OPENROUTER_MODEL);
    }
  }

  return DEFAULT_GATEWAY_MODEL;
}

export interface UserMusicKeys {
  suno?: string;
  minimax?: string;
}

/** Per-user music provider keys; the clients fall back to server env vars when absent. */
export async function getUserMusicKeys(userId: string): Promise<UserMusicKeys> {
  const row = await getUserSettingsRow(userId);
  return {
    suno: safeDecrypt(row?.sunoKeyEnc) ?? undefined,
    minimax: safeDecrypt(row?.minimaxKeyEnc) ?? undefined,
  };
}
