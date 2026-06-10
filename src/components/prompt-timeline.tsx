"use client";

import { Star, Clock, CheckCircle2, FileEdit, Archive, Loader2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrackVersion, TrackStatus } from "@/types/music";

interface WordDiff {
  type: "equal" | "added" | "removed";
  word: string;
}

function computeWordDiff(prev: string, next: string): WordDiff[] {
  const prevWords = prev.split(/(\s+)/).filter(Boolean);
  const nextWords = next.split(/(\s+)/).filter(Boolean);

  // Simple LCS-based diff
  const m = prevWords.length;
  const n = nextWords.length;

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (prevWords[i - 1] === nextWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const result: WordDiff[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && prevWords[i - 1] === nextWords[j - 1]) {
      result.unshift({ type: "equal", word: nextWords[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: "added", word: nextWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: "removed", word: prevWords[i - 1] });
      i--;
    }
  }

  return result;
}

function DiffDisplay({ diff }: { diff: WordDiff[] }) {
  return (
    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words">
      {diff.map((chunk, idx) => {
        if (chunk.type === "equal") {
          return <span key={idx}>{chunk.word}</span>;
        } else if (chunk.type === "added") {
          return (
            <mark
              key={idx}
              className="bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-200 rounded-sm px-0.5"
            >
              {chunk.word}
            </mark>
          );
        } else {
          return (
            <del
              key={idx}
              className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through rounded-sm px-0.5"
            >
              {chunk.word}
            </del>
          );
        }
      })}
    </p>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3.5 h-3.5",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-zinc-300 dark:text-zinc-600"
          )}
        />
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<
  TrackStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  draft: {
    label: "Draft",
    icon: FileEdit,
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  generating: {
    label: "Generating",
    icon: Loader2,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  complete: {
    label: "Complete",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  },
};

interface PromptTimelineProps {
  versions: TrackVersion[];
  currentVersionId: string;
  onSelectVersion: (versionId: string) => void;
}

export function PromptTimeline({
  versions,
  currentVersionId,
  onSelectVersion,
}: PromptTimelineProps) {
  if (versions.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center text-zinc-500 dark:text-zinc-400">
        <Clock className="w-8 h-8 opacity-40" />
        <p className="text-sm font-medium">Start your prompt history</p>
        <p className="text-xs max-w-xs">
          As you create new versions and refine your prompts, this timeline will show how your
          creative vision evolved.
        </p>
      </div>
    );
  }

  // Sort descending (newest first)
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  // Build a lookup for previous version prompts (ascending order)
  const ascending = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const prevPromptMap = new Map<string, string>();
  for (let i = 1; i < ascending.length; i++) {
    prevPromptMap.set(ascending[i].id, ascending[i - 1].prompt);
  }

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-200 dark:bg-zinc-700 z-0" />

      <div className="space-y-4">
        {sorted.map((v) => {
          const isCurrent = v.id === currentVersionId;
          const prevPrompt = prevPromptMap.get(v.id);
          const hasDiff = prevPrompt !== undefined;
          const diff = hasDiff ? computeWordDiff(prevPrompt, v.prompt) : null;
          const statusCfg = STATUS_CONFIG[v.status];
          const StatusIcon = statusCfg.icon;

          return (
            <div key={v.id} className="relative flex gap-4 z-10">
              {/* Version badge on left */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10",
                    isCurrent
                      ? "border-violet-500 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                      : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  v{v.versionNumber}
                </div>
              </div>

              {/* Card */}
              <div
                className={cn(
                  "flex-1 rounded-lg border p-3 space-y-2 transition-colors",
                  isCurrent
                    ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                )}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {v.isBest && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      <Crown className="w-3 h-3 fill-current" />
                      Best
                    </span>
                  )}
                  {isCurrent && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-1.5 py-0 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                    >
                      Current
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      statusCfg.color
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "w-3 h-3",
                        v.status === "generating" ? "animate-spin" : ""
                      )}
                    />
                    {statusCfg.label}
                  </span>
                  <StarRating rating={v.rating} />
                  <div className="ml-auto">
                    {!isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectVersion(v.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>

                {/* Prompt content */}
                {v.prompt ? (
                  <div className="max-h-36 overflow-y-auto">
                    {diff ? (
                      <DiffDisplay diff={diff} />
                    ) : (
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words">
                        {v.prompt}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs italic text-zinc-400">No prompt set</p>
                )}

                {/* Diff legend if there is one */}
                {diff && hasDiff && (() => {
                  const idx = ascending.findIndex((a) => a.id === v.id);
                  const prevVersion = idx > 0 ? ascending[idx - 1] : null;
                  return prevVersion ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Changes vs v{prevVersion.versionNumber} highlighted
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
