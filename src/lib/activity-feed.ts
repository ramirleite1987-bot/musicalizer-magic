import type { Track, Theme } from "@/types/music";

export type ActivityEventType =
  | "track_created"
  | "version_created"
  | "version_completed"
  | "version_best"
  | "theme_assigned";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  trackId?: string;
  trackName?: string;
  versionNumber?: number;
  themeName?: string;
  timestamp: string;
  label: string;
  icon: string;
}

const ICONS: Record<ActivityEventType, string> = {
  track_created: "Music2",
  version_created: "GitBranch",
  version_completed: "CheckCircle2",
  version_best: "Star",
  theme_assigned: "Tag",
};

/**
 * Derives a chronological list of activity events from the existing track and
 * theme data without any additional DB queries. Events are sorted newest-first
 * and capped at 50 entries.
 */
export function deriveActivityEvents(
  tracks: Track[],
  themes: Theme[]
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const track of tracks) {
    // track_created
    events.push({
      id: `track_created_${track.id}`,
      type: "track_created",
      trackId: track.id,
      trackName: track.name,
      timestamp: track.createdAt,
      label: `Track "${track.name}" created`,
      icon: ICONS.track_created,
    });

    for (const version of track.versions) {
      // version_created
      events.push({
        id: `version_created_${version.id}`,
        type: "version_created",
        trackId: track.id,
        trackName: track.name,
        versionNumber: version.versionNumber,
        timestamp: version.createdAt,
        label: `Version ${version.versionNumber} created for "${track.name}"`,
        icon: ICONS.version_created,
      });

      // version_completed — only if status is complete and updatedAt differs from createdAt
      if (version.status === "complete") {
        const useTs =
          version.updatedAt && version.updatedAt !== version.createdAt
            ? version.updatedAt
            : version.createdAt;
        events.push({
          id: `version_completed_${version.id}`,
          type: "version_completed",
          trackId: track.id,
          trackName: track.name,
          versionNumber: version.versionNumber,
          timestamp: useTs,
          label: `Version ${version.versionNumber} completed for "${track.name}"`,
          icon: ICONS.version_completed,
        });
      }

      // version_best
      if (version.isBest) {
        const useTs =
          version.updatedAt && version.updatedAt !== version.createdAt
            ? version.updatedAt
            : version.createdAt;
        events.push({
          id: `version_best_${version.id}`,
          type: "version_best",
          trackId: track.id,
          trackName: track.name,
          versionNumber: version.versionNumber,
          timestamp: useTs,
          label: `Version ${version.versionNumber} marked as best for "${track.name}"`,
          icon: ICONS.version_best,
        });
      }
    }

    // theme_assigned — emit one event per theme linked to this track, using
    // the track's updatedAt as the closest proxy for when the assignment happened.
    for (const themeId of track.themeIds) {
      const theme = themes.find((t) => t.id === themeId);
      const themeName = theme?.name ?? themeId;
      events.push({
        id: `theme_assigned_${track.id}_${themeId}`,
        type: "theme_assigned",
        trackId: track.id,
        trackName: track.name,
        themeName,
        timestamp: track.updatedAt,
        label: `Theme "${themeName}" assigned to "${track.name}"`,
        icon: ICONS.theme_assigned,
      });
    }
  }

  // Sort newest first, cap at 50
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return events.slice(0, 50);
}

/**
 * Returns a human-readable relative time string (e.g. "2h ago", "3d ago").
 */
export function relativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}
