import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ userId: "user_a" as string | null }));
const ownedTrackIds = vi.hoisted(() => new Set<string>(["track-owner"]));
const ownedVersions = vi.hoisted(
  () =>
    new Map<string, { id: string; trackId: string }>([
      ["ver-owner", { id: "ver-owner", trackId: "track-owner" }],
    ])
);

vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
}));

vi.mock("@/lib/auth", () => ({
  requireUserId: async () => {
    if (!authState.userId) throw new Error("Not authenticated");
    return authState.userId;
  },
}));

const ownedVersionRow = {
  versionNumber: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  status: "complete" as const,
  prompt: "from-db",
  negativePrompt: "",
  lyrics: "",
  style: { genre: "pop", moods: [], tempo: 120, key: "C", isMinor: false, instruments: [], vocalStyle: "", duration: "auto", sunoApiVersion: "v4" },
  rating: 0,
  dimensionScores: {},
  notes: "",
  feedback: {},
  isBest: false,
  audioFileName: null,
  audioUrl: "https://blob.example/owned.mp3",
  sunoTaskId: null,
  provider: "suno",
  providerTaskId: null,
};

vi.mock("@/lib/db/ownership", () => ({
  requireOwnedTrack: async (trackId: string, userId: string) => {
    if (!ownedTrackIds.has(trackId)) throw new Error("Track not found");
    return { id: trackId, userId, name: "Owned Song" };
  },
  requireOwnedVersion: async (versionId: string, userId: string) => {
    const row = ownedVersions.get(versionId);
    if (!row) throw new Error("Version not found");
    return { ...ownedVersionRow, ...row, userId };
  },
}));

const selectLimit = vi.hoisted(() =>
  vi.fn(async (...args: unknown[]) => {
    void args;
    return [] as unknown[];
  })
);
const insertValues = vi.hoisted(() =>
  vi.fn(async (values: Record<string, unknown>) => values)
);
const insertReturning = vi.hoisted(() =>
  vi.fn(async (values: Record<string, unknown>) => [
    { id: "new-track", ...values },
  ])
);
const deleteWhere = vi.hoisted(() => vi.fn(async () => undefined));
const updateWhere = vi.hoisted(() => vi.fn(async () => undefined));
const themeFindFirst = vi.hoisted(() => vi.fn(async () => null));
const captured = vi.hoisted(() => ({
  trackInsert: null as Record<string, unknown> | null,
  themeInsert: null as Record<string, unknown> | null,
  shareInsert: null as Record<string, unknown> | null,
  versionUpdate: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({ limit: (n: number) => selectLimit(n) }),
          limit: (n: number) => selectLimit(n),
        }),
      }),
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        if ("token" in values && "versionData" in values) {
          captured.shareInsert = values;
        }
        if ("genre" in values && "tags" in values) {
          captured.trackInsert = values;
        }
        if (values.source === "manual") {
          captured.themeInsert = values;
        }
        insertValues(values);
        return {
          returning: async () => insertReturning(values),
          onConflictDoNothing: async () => undefined,
        };
      },
    }),
    delete: () => ({ where: deleteWhere }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        captured.versionUpdate = values;
        return { where: updateWhere };
      },
    }),
    query: {
      themes: { findFirst: themeFindFirst },
    },
  }),
}));

import {
  getChatMessages,
  clearChatHistory,
} from "@/app/actions/chat";
import { createShareLink, revokeShareLink } from "@/app/actions/share";
import { createCatholicTrack } from "@/app/actions/catholic";
import { generateLyrics } from "@/app/actions/ai-suggestions";
import { updateVersion } from "@/app/actions/versions";

describe("chat ownership", () => {
  beforeEach(() => {
    authState.userId = "user_a";
    ownedTrackIds.clear();
    ownedTrackIds.add("track-owner");
    selectLimit.mockClear();
    deleteWhere.mockClear();
    selectLimit.mockResolvedValue([]);
  });

  it("reads chat only for an owned track", async () => {
    await expect(getChatMessages("track-owner")).resolves.toEqual([]);
    expect(selectLimit).toHaveBeenCalled();
  });

  it("rejects chat reads for another user's track", async () => {
    await expect(getChatMessages("track-other")).rejects.toThrow(
      "Track not found"
    );
    expect(selectLimit).not.toHaveBeenCalled();
  });

  it("rejects chat deletes for another user's track", async () => {
    await expect(clearChatHistory("track-other")).rejects.toThrow(
      "Track not found"
    );
    expect(deleteWhere).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated chat reads", async () => {
    authState.userId = null;
    await expect(getChatMessages("track-owner")).rejects.toThrow(
      "Not authenticated"
    );
  });
});

describe("share ownership", () => {
  beforeEach(() => {
    authState.userId = "user_a";
    ownedTrackIds.clear();
    ownedTrackIds.add("track-owner");
    captured.shareInsert = null;
    selectLimit.mockReset();
    updateWhere.mockClear();
  });

  it("creates a share link only when the caller owns the track and version", async () => {
    const url = await createShareLink("track-owner", "ver-owner");
    expect(url).toMatch(/\/share\/[a-f0-9]{32}$/);
    expect(captured.shareInsert?.trackId).toBe("track-owner");
    expect(captured.shareInsert?.trackName).toBe("Owned Song");
    expect(
      (captured.shareInsert?.versionData as { prompt?: string } | undefined)
        ?.prompt
    ).toBe("from-db");
  });

  it("refuses to mint a share link for another user's track", async () => {
    await expect(
      createShareLink("track-other", "ver-owner")
    ).rejects.toThrow("Track not found");
  });

  it("does not revoke another user's share token", async () => {
    selectLimit.mockResolvedValue([
      { token: "abc", trackId: "track-other", revokedAt: null },
    ]);
    await expect(revokeShareLink("abc")).rejects.toThrow("Track not found");
    expect(updateWhere).not.toHaveBeenCalled();
  });
});

describe("catholic track ownership", () => {
  beforeEach(() => {
    authState.userId = "user_a";
    captured.trackInsert = null;
    captured.themeInsert = null;
    themeFindFirst.mockResolvedValue(null);
    insertReturning.mockImplementation(async (values) => [
      { id: "theme-or-track", ...values },
    ]);
  });

  it("stores the creator userId on new catholic tracks", async () => {
    const id = await createCatholicTrack({
      themeId: "nossaSenhora",
      name: "Ave",
      prompt: "p",
      negativePrompt: "n",
      lyrics: "l",
      language: "pt",
      instrumental: false,
    });
    expect(id).toBeTruthy();
    expect(captured.trackInsert?.userId).toBe("user_a");
    expect(captured.themeInsert?.userId).toBe("user_a");
  });

  it("rejects unauthenticated catholic track creates", async () => {
    authState.userId = null;
    await expect(
      createCatholicTrack({
        themeId: "nossaSenhora",
        name: "Ave",
        prompt: "p",
        negativePrompt: "n",
        lyrics: "l",
        language: "pt",
        instrumental: false,
      })
    ).rejects.toThrow("Not authenticated");
  });
});

describe("version update mass assignment", () => {
  beforeEach(() => {
    authState.userId = "user_a";
    ownedTrackIds.clear();
    ownedTrackIds.add("track-owner");
    captured.versionUpdate = null;
    updateWhere.mockClear();
  });

  it("persists https audioUrl and marks the version complete", async () => {
    await updateVersion("ver-owner", {
      audioUrl: "https://blob.example/upload.mp3",
      audioFileName: "upload.mp3",
      status: "complete",
    });
    expect(captured.versionUpdate?.audioUrl).toBe(
      "https://blob.example/upload.mp3"
    );
    expect(captured.versionUpdate?.status).toBe("complete");
    expect(captured.versionUpdate).not.toHaveProperty("sunoTaskId");
  });

  it("rejects javascript: audioUrl and ignores client task ids", async () => {
    await expect(
      updateVersion("ver-owner", {
        audioUrl: "javascript:alert(1)",
        sunoTaskId: "hijack",
        providerTaskId: "hijack",
      })
    ).rejects.toThrow("Audio URL must be https");
    expect(updateWhere).not.toHaveBeenCalled();
  });
});

describe("ai-suggestions auth", () => {
  it("rejects unauthenticated lyrics generation before calling the model", async () => {
    authState.userId = null;
    await expect(
      generateLyrics({
        trackName: "t",
        prompt: "p",
        genre: "pop",
        moods: [],
        style: {},
      })
    ).rejects.toThrow("Not authenticated");
  });
});
