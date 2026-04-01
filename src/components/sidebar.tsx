"use client";

import { useState } from "react";
import { Music, Search, Star } from "lucide-react";
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
}

export function Sidebar({ tracks, themes, selectedTrackId, onSelectTrack }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.name.toLowerCase().includes(search.toLowerCase());
    const matchesTheme =
      themeFilter === "all" || track.themeIds.includes(themeFilter);
    return matchesSearch && matchesTheme;
  });

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
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search tracks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredTracks.map((track) => {
            const rating = getTrackRating(track);
            const status = getTrackStatus(track);
            const isSelected = track.id === selectedTrackId;
            const trackThemes = track.themeIds
              .map(getThemeById)
              .filter(Boolean) as Theme[];

            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent"
                )}
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
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
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
            );
          })}

          {filteredTracks.length === 0 && (
            <div className="py-8 text-center text-sm text-zinc-400">
              No tracks found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
