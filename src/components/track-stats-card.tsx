"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Star, Zap, TrendingUp, Music, CheckCircle2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Track, DimensionScores } from "@/types/music";

interface TrackStatsCardProps {
  track: Track;
}

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  melody: "Melody",
  harmony: "Harmony",
  rhythm: "Rhythm",
  production: "Production",
  lyricsFit: "Lyrics Fit",
  originality: "Originality",
  emotionalImpact: "Emotional",
};

function scoreColor(score: number): string {
  if (score >= 8) return "bg-green-500 dark:bg-green-400";
  if (score >= 5) return "bg-amber-500 dark:bg-amber-400";
  return "bg-red-500 dark:bg-red-400";
}

function ratingColor(rating: number): string {
  if (rating >= 8) return "text-green-600 dark:text-green-400";
  if (rating >= 5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function successRateColor(rate: number): string {
  if (rate >= 80) return "text-green-600 dark:text-green-400";
  if (rate >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function TrackStatsCard({ track }: TrackStatsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const versions = track.versions;

  // Total versions
  const totalVersions = versions.length;

  // Average rating (exclude 0-rated)
  const ratedVersions = versions.filter((v) => v.rating > 0);
  const avgRating =
    ratedVersions.length > 0
      ? ratedVersions.reduce((sum, v) => sum + v.rating, 0) / ratedVersions.length
      : null;

  // Generation success rate: complete / non-draft versions
  const nonDraftVersions = versions.filter((v) => v.status !== "draft");
  const completeVersions = versions.filter((v) => v.status === "complete");
  const successRate =
    nonDraftVersions.length > 0
      ? Math.round((completeVersions.length / nonDraftVersions.length) * 100)
      : null;

  // Most used provider
  const providerCounts: Record<string, number> = {};
  for (const v of versions) {
    const p = v.provider ?? v.style.provider ?? "suno";
    providerCounts[p] = (providerCounts[p] ?? 0) + 1;
  }
  const mostUsedProvider =
    Object.keys(providerCounts).length > 0
      ? Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Best dimension scores from the version marked isBest
  const bestVersion = versions.find((v) => v.isBest);
  const dimensionScores = bestVersion?.dimensionScores ?? null;

  // Check if dimension scores have any data
  const hasDimensionData =
    dimensionScores !== null &&
    Object.values(dimensionScores).some((s) => s > 0);

  if (totalVersions === 0) return null;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="font-medium">Track Stats</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Total versions */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <Music className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wide font-medium">Versions</span>
              </div>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {totalVersions}
              </span>
            </div>

            {/* Avg rating */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <Star className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wide font-medium">Avg Rating</span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  avgRating !== null ? ratingColor(avgRating) : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {avgRating !== null ? avgRating.toFixed(1) : "—"}
              </span>
            </div>

            {/* Success rate */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wide font-medium">Success</span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  successRate !== null
                    ? successRateColor(successRate)
                    : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {successRate !== null ? `${successRate}%` : "—"}
              </span>
            </div>

            {/* Most used provider */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-2 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <Zap className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wide font-medium">Provider</span>
              </div>
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 capitalize truncate">
                {mostUsedProvider ?? "—"}
              </span>
            </div>
          </div>

          {/* Completed count */}
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Completed generations</span>
            </div>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {completeVersions.length}
            </span>
          </div>

          {/* Best version dimension scores */}
          {hasDimensionData && dimensionScores !== null && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide font-medium text-zinc-400 dark:text-zinc-500">
                Best Version Scores
              </p>
              {(Object.entries(dimensionScores) as [keyof DimensionScores, number][]).map(
                ([dim, score]) => (
                  <div key={dim} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-16 flex-shrink-0 truncate">
                      {DIMENSION_LABELS[dim]}
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", scoreColor(score))}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 w-5 text-right flex-shrink-0">
                      {score > 0 ? score : "—"}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
