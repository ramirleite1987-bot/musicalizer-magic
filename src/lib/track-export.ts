import type { Track, TrackVersion } from "@/types/music";

export interface TrackExportData {
  exportVersion: 1;
  exportedAt: string;
  track: {
    name: string;
    genre: string;
    themeNames: string[];
    versions: Partial<TrackVersion>[];
  };
}

/**
 * Builds a JSON export blob and triggers a browser download.
 * The track must include .themeNames if you want them preserved;
 * since the Track type only carries themeIds we accept an optional
 * themeNames lookup map.
 */
export function exportTrackAsJSON(
  track: Track,
  themeNames: Record<string, string> = {}
): void {
  const resolvedThemeNames = track.themeIds.map(
    (id) => themeNames[id] ?? id
  );

  const payload: TrackExportData = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    track: {
      name: track.name,
      genre: track.genre,
      themeNames: resolvedThemeNames,
      versions: track.versions.map((v) => ({
        versionNumber: v.versionNumber,
        status: v.status,
        prompt: v.prompt,
        negativePrompt: v.negativePrompt,
        lyrics: v.lyrics,
        style: v.style,
        rating: v.rating,
        dimensionScores: v.dimensionScores,
        notes: v.notes,
        feedback: v.feedback,
        isBest: v.isBest,
        provider: v.provider,
        // intentionally omit: id, trackId, audioUrl, audioFileName, sunoTaskId, providerTaskId
      })),
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safeName = track.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = `${safeName}-${date}.json`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses an imported JSON file's contents.
 * Returns the minimal data needed to recreate a track via the server action.
 * Throws a descriptive Error if the format is invalid.
 */
export function parseTrackImport(json: unknown): {
  name: string;
  genre: string;
  versions: Partial<TrackVersion>[];
} {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid export file: expected a JSON object.");
  }

  const obj = json as Record<string, unknown>;

  if (obj.exportVersion !== 1) {
    throw new Error(
      `Unsupported export version: ${String(obj.exportVersion ?? "unknown")}. Only version 1 is supported.`
    );
  }

  const track = obj.track;
  if (typeof track !== "object" || track === null || Array.isArray(track)) {
    throw new Error("Invalid export file: missing 'track' object.");
  }

  const trackObj = track as Record<string, unknown>;

  if (typeof trackObj.name !== "string" || trackObj.name.trim() === "") {
    throw new Error("Invalid export file: track name is missing or empty.");
  }

  if (typeof trackObj.genre !== "string" || trackObj.genre.trim() === "") {
    throw new Error("Invalid export file: track genre is missing or empty.");
  }

  const rawVersions = trackObj.versions;
  if (!Array.isArray(rawVersions)) {
    throw new Error("Invalid export file: 'versions' must be an array.");
  }

  const versions: Partial<TrackVersion>[] = rawVersions.map(
    (v: unknown, i: number) => {
      if (typeof v !== "object" || v === null || Array.isArray(v)) {
        throw new Error(`Invalid version at index ${i}: expected an object.`);
      }
      const vObj = v as Record<string, unknown>;
      // Pass through all recognised fields; the server action applies defaults
      return {
        versionNumber: typeof vObj.versionNumber === "number" ? vObj.versionNumber : i + 1,
        status:
          vObj.status === "draft" ||
          vObj.status === "complete" ||
          vObj.status === "archived"
            ? vObj.status
            : "draft",
        prompt: typeof vObj.prompt === "string" ? vObj.prompt : "",
        negativePrompt: typeof vObj.negativePrompt === "string" ? vObj.negativePrompt : "",
        lyrics: typeof vObj.lyrics === "string" ? vObj.lyrics : "",
        style: typeof vObj.style === "object" && vObj.style !== null
          ? (vObj.style as TrackVersion["style"])
          : undefined,
        rating: typeof vObj.rating === "number" ? vObj.rating : 0,
        dimensionScores:
          typeof vObj.dimensionScores === "object" && vObj.dimensionScores !== null
            ? (vObj.dimensionScores as TrackVersion["dimensionScores"])
            : undefined,
        notes: typeof vObj.notes === "string" ? vObj.notes : "",
        feedback:
          typeof vObj.feedback === "object" && vObj.feedback !== null
            ? (vObj.feedback as TrackVersion["feedback"])
            : undefined,
        isBest: typeof vObj.isBest === "boolean" ? vObj.isBest : false,
        provider:
          vObj.provider === "suno" || vObj.provider === "minimax"
            ? vObj.provider
            : undefined,
      };
    }
  );

  return {
    name: trackObj.name.trim(),
    genre: trackObj.genre.trim(),
    versions,
  };
}
