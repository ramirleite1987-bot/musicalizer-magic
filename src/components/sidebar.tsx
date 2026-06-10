"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Music, Search, Star, Tag, MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Track, Theme } from "@/types/music";
import { TrackStatsCard } from "@/components/track-stats-card";
import { TrackTags } from "@/components/track-tags";
import { duplicateTrack as duplicateTrackAction, deleteTrack as deleteTrackAction } from "@/app/actions/tracks";
import { toast } from "sonner";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
};

interface SidebarProps {
  tracks: Track[];
  themes: Theme[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onTrackDuplicated?: (newTrackId: string) => void;
  onTrackDeleted?: (deletedTrackId: string) => void;
}

export function Sidebar({
  tracks,
  themes,
  selectedTrackId,
  onSelectTrack,
  onTrackDuplicated,
  onTrackDeleted,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  // Local optimistic tag overrides keyed by trackId
  const [tagOverrides, setTagOverrides] = useState<Record<string, string[]>>({});
  // Track context menu state
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  const closeMenu = useCallback(() => setOpenMenuTrackId(null), []);

  useEffect(() => {
    if (!openMenuTrackId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuTrackId, closeMenu]);

  const handleDuplicate = useCallback(
    async (trackId: string) => {
      closeMenu();
      setIsDuplicating(true);
      try {
        const newTrackId = await duplicateTrackAction(trackId);
        toast.success("Track duplicated", {
          description: "Navigate to the new track to start editing.",
        });
        if (onTrackDuplicated) {
          onTrackDuplicated(newTrackId);
        } else {
          // Fallback: reload page
          window.location.reload();
        }
      } catch (err) {
        toast.error("Failed to duplicate track", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsDuplicating(false);
      }
    },
    [closeMenu, onTrackDuplicated]
  );

  const handleDelete = useCallback(
    async (trackId: string) => {
      closeMenu();
      try {
        await deleteTrackAction(trackId);
        toast.success("Track deleted");
        if (onTrackDeleted) {
          onTrackDeleted(trackId);
        } else {
          window.location.reload();
        }
      } catch (err) {
        toast.error("Failed to delete track", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    },
    [closeMenu, onTrackDeleted]
  );

  const getTrackTags = (track: Track): string[] =>
    tagOverrides[track.id] ?? track.tags ?? [];

  const handleTagsChange = (trackId: string, tags: string[]) => {
    setTagOverrides((prev) => ({ ...prev, [trackId]: tags }));
  };

  const searchLower = search.toLowerCase().trim();
  // Detect if search looks like a tag query (starts with #)
  const isTagSearch = searchLower.startsWith("#");
  const tagQuery = isTagSearch ? searchLower.slice(1) : searchLower;

  const filteredTracks = useMemo(() =>
    tracks.filter((track) => {
      const tags = getTrackTags(track);
      let matchesSearch: boolean;
      if (isTagSearch) {
        // Only match tags when query starts with #
        matchesSearch = tags.some((t) => t.includes(tagQuery));
      } else {
        // Match name OR any tag
        matchesSearch =
          !searchLower ||
          track.name.toLowerCase().includes(searchLower) ||
          tags.some((t) => t.includes(searchLower));
      }
      const matchesTheme =
        themeFilter === "all" || track.themeIds.includes(themeFilter);
      return matchesSearch && matchesTheme;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tracks, searchLower, isTagSearch, tagQuery, themeFilter, tagOverrides]
  );

  const getTrackRating = (track: Track) => {
    const bestVersion = track.versions.find((v) => v.isBest);
    if (bestVersion) return bestVersion.rating;
    const ratings = track.versions.map((v) => v.rating).filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    return Math.max(...ratings);
  };

  const getTrackStatus = (track: Track) => {
    if (track.versions.some((v) => v.status === "generating")) return "generating";
    if (track.versions.some((v) => v.status === "complete")) return "complete";
    if (track.versions.length > 0) return track.versions[track.versions.length - 1].status;
    return "draft";
  };

  const getThemeById = (id: string) => themes.find((t) => t.id === id);

  return (
    <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Musicalizer Magic
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 space-y-2">
        <div className="relative">
          {isTagSearch && searchLower.length > 1 ? (
            <Tag className="absolute left-2.5 top-2.5 w-4 h-4 text-violet-400" />
          ) : (
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
          )}
          <Input
            placeholder="Search tracks or #tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "pl-8 h-8 text-sm",
              isTagSearch && searchLower.length > 1 &&
                "border-violet-300 dark:border-violet-700 ring-1 ring-violet-200 dark:ring-violet-800"
            )}
          />
        </div>
        {isTagSearch && searchLower.length > 1 && (
          <p className="text-[10px] text-violet-500 dark:text-violet-400 px-1">
            Filtering by tag: {search.trim()}
          </p>
        )}

        {/* Theme filter */}
        <Select value={themeFilter} onValueChange={(v) => setThemeFilter(v ?? "all")}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Filter by theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All themes</SelectItem>
            {themes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      COLOR_MAP[theme.color] ?? "bg-zinc-400"
                    )}
                  />
                  {theme.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track count */}
      <div className="px-3 pb-1">
        <p className="text-xs text-zinc-400">
          {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {filteredTracks.map((track) => {
            const rating = getTrackRating(track);
            const status = getTrackStatus(track);
            const isSelected = track.id === selectedTrackId;
            const hasBestVersion = track.versions.some((v) => v.isBest);
            const trackThemes = track.themeIds
              .map(getThemeById)
              .filter(Boolean) as Theme[];

            const trackTags = getTrackTags(track);

            const isMenuOpen = openMenuTrackId === track.id;

            return (
              <div
                key={track.id}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors group relative",
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent"
                )}
              >
                <button
                  onClick={() => onSelectTrack(track.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium leading-tight truncate",
                        isSelected
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-zinc-900 dark:text-zinc-100"
                      )}
                    >
                      {track.name}
                    </span>
                    {rating > 0 && (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star
                          className={cn(
                            "w-3 h-3 text-yellow-400 fill-yellow-400",
                            hasBestVersion && "animate-pulse"
                          )}
                        />
                        <span className="text-xs text-zinc-500">{rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zinc-500">{track.genre}</span>
                      {status === "generating" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        >
                          gen
                        </Badge>
                      )}
                    </div>

                    {/* Theme dots */}
                    {trackThemes.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {trackThemes.slice(0, 3).map((theme) => (
                          <div
                            key={theme.id}
                            title={theme.name}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              COLOR_MAP[theme.color] ?? "bg-zinc-400"
                            )}
                          />
                        ))}
                        {trackThemes.length > 3 && (
                          <span className="text-[10px] text-zinc-400">
                            +{trackThemes.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-zinc-400">
                    {track.versions.length} version
                    {track.versions.length !== 1 ? "s" : ""}
                  </div>
                </button>

                {/* Tags row — always visible, click inside doesn't propagate to track select */}
                <div
                  className="mt-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TrackTags
                    trackId={track.id}
                    tags={trackTags}
                    onTagsChange={(tags) => handleTagsChange(track.id, tags)}
                  />
                </div>

                {/* Three-dot context menu button */}
                <div
                  className="absolute top-2 right-2"
                  onClick={(e) => e.stopPropagation()}
                  ref={isMenuOpen ? menuRef : undefined}
                >
                  <button
                    type="button"
                    aria-label="Track options"
                    disabled={isDuplicating}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuTrackId(isMenuOpen ? null : track.id);
                    }}
                    className={cn(
                      "p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors",
                      "opacity-0 group-hover:opacity-100 focus:opacity-100",
                      isMenuOpen && "opacity-100 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                    )}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-6 z-50 min-w-[130px] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1">
                      <button
                        type="button"
                        disabled={isDuplicating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(track.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {isDuplicating ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(track.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTracks.length === 0 && (
            <div className="py-8 text-center text-sm text-zinc-400">
              No tracks found
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats card for selected track */}
      {(() => {
        const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
        return selectedTrack ? <TrackStatsCard track={selectedTrack} /> : null;
      })()}
    </div>
  );
}
