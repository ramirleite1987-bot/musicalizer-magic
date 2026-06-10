"use client";

import { useMemo, useState } from "react";
import {
  Music2,
  GitBranch,
  CheckCircle2,
  Star,
  Tag,
  X,
  Clock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Track, Theme } from "@/types/music";
import {
  deriveActivityEvents,
  relativeTime,
  type ActivityEvent,
  type ActivityEventType,
} from "@/lib/activity-feed";

const ICON_MAP: Record<ActivityEventType, React.ElementType> = {
  track_created: Music2,
  version_created: GitBranch,
  version_completed: CheckCircle2,
  version_best: Star,
  theme_assigned: Tag,
};

const ICON_COLOR_MAP: Record<ActivityEventType, string> = {
  track_created: "text-violet-500",
  version_created: "text-blue-500",
  version_completed: "text-green-500",
  version_best: "text-yellow-500",
  theme_assigned: "text-pink-500",
};

interface ActivityEventRowProps {
  event: ActivityEvent;
  onSelectTrack: (trackId: string) => void;
}

function ActivityEventRow({ event, onSelectTrack }: ActivityEventRowProps) {
  const Icon = ICON_MAP[event.type] ?? Clock;
  const colorClass = ICON_COLOR_MAP[event.type] ?? "text-zinc-400";

  return (
    <button
      type="button"
      onClick={() => event.trackId && onSelectTrack(event.trackId)}
      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors group"
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800",
          "group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors"
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", colorClass)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-snug">
          {event.label}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {event.trackName && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 truncate max-w-[120px]">
              {event.trackName}
            </span>
          )}
          <span className="text-[10px] text-zinc-400">
            {relativeTime(event.timestamp)}
          </span>
        </div>
      </div>
    </button>
  );
}

interface ActivityPanelProps {
  tracks: Track[];
  themes: Theme[];
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export function ActivityPanel({
  tracks,
  themes,
  onSelectTrack,
  onClose,
}: ActivityPanelProps) {
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const allEvents = useMemo(
    () => deriveActivityEvents(tracks, themes),
    [tracks, themes]
  );

  const filteredEvents = useMemo<ActivityEvent[]>(() => {
    if (trackFilter === "all") return allEvents;
    return allEvents.filter((e) => e.trackId === trackFilter);
  }, [allEvents, trackFilter]);

  const handleSelectTrack = (trackId: string) => {
    onSelectTrack(trackId);
    onClose();
  };

  return (
    <>
      {/* Backdrop for closing */}
      <div
        className="fixed inset-0 z-30"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-14 bottom-0 z-40 w-80 flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Activity
            </h2>
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {filteredEvents.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
            onClick={onClose}
            aria-label="Close activity panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter */}
        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/70 flex-shrink-0">
          <Select
            value={trackFilter}
            onValueChange={(v) => setTrackFilter(v ?? "all")}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Filter by track" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>
                  {track.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Events list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <ActivityEventRow
                  key={event.id}
                  event={event}
                  onSelectTrack={handleSelectTrack}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Clock className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No activity yet.
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Create your first track to get started!
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
