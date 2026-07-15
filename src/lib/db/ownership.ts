import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";

/** Throws unless the track exists and belongs to the user. Returns the track row. */
export async function requireOwnedTrack(trackId: string, userId: string) {
  const db = getDb();
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, trackId), eq(tracks.userId, userId)))
    .limit(1);
  if (!track) {
    throw new Error("Track not found");
  }
  return track;
}

/**
 * Throws unless the version exists and its parent track belongs to the user.
 * Returns the version row.
 */
export async function requireOwnedVersion(versionId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select({ version: trackVersions })
    .from(trackVersions)
    .innerJoin(tracks, eq(trackVersions.trackId, tracks.id))
    .where(and(eq(trackVersions.id, versionId), eq(tracks.userId, userId)))
    .limit(1);
  if (!row) {
    throw new Error("Version not found");
  }
  return row.version;
}
