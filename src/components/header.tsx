"use client";

import { Sparkles, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Track, TrackVersion } from "@/types/music";

interface HeaderProps {
  track: Track | null;
  version: TrackVersion | null;
  onGenerate: () => void;
}

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: Clock, className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  generating: { label: "Generating", icon: Loader2, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  archived: { label: "Archived", icon: AlertCircle, className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

export function Header({ track, version, onGenerate }: HeaderProps) {
  if (!track) {
    return (
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 bg-white dark:bg-zinc-950">
        <p className="text-sm text-zinc-400">Select a track to get started</p>
      </div>
    );
  }

  const status = version?.status ?? "draft";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const isGenerating = status === "generating";

  return (
    <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-950 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
          {track.name}
        </span>
        {version && (
          <>
            <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="text-sm text-zinc-500 flex-shrink-0">
              v{version.versionNumber}
            </span>
          </>
        )}
      </div>

      {/* Right side: badges + generate button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status badge */}
        {version && (
          <Badge
            variant="secondary"
            className={cn("flex items-center gap-1 text-xs", statusConfig.className)}
          >
            <StatusIcon className={cn("w-3 h-3", isGenerating && "animate-spin")} />
            {statusConfig.label}
          </Badge>
        )}

        {/* Provider + model badge */}
        {version?.style && (() => {
          const provider = version.style.provider ?? "suno";
          const label =
            provider === "minimax"
              ? `Minimax ${version.style.minimaxModel || "music-1.5"}`
              : `Suno ${version.style.sunoApiVersion || ""}`.trim();
          return (
            <Badge variant="outline" className="text-xs text-zinc-500">
              {label}
            </Badge>
          );
        })()}

        {/* Best version badge */}
        {version?.isBest && (
          <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
            ★ Best
          </Badge>
        )}

        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate
        </Button>
      </div>
    </div>
  );
}
