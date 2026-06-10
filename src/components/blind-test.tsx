"use client";

import { useState, useCallback, useRef } from "react";
import { X, Star, Headphones, Trophy, RotateCcw, CheckCircle2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveformPlayer } from "@/components/waveform-player";
import { cn } from "@/lib/utils";
import type { TrackVersion } from "@/types/music";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "selecting" | "testing" | "results";

interface ShuffledOption {
  label: string; // "Option A", "Option B", ...
  version: TrackVersion;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= value
              ? "text-yellow-400 fill-yellow-400"
              : "text-zinc-600"
          )}
        />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BlindTestProps {
  versions: TrackVersion[];
  trackName: string;
  onMarkBest: (versionId: string) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlindTest({ versions, trackName, onMarkBest, onClose }: BlindTestProps) {
  const audioVersions = versions.filter((v) => v.audioUrl !== null && v.status !== "archived");

  const [phase, setPhase] = useState<Phase>("selecting");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shuffled, setShuffled] = useState<ShuffledOption[]>([]);
  const [winnerLabel, setWinnerLabel] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [markedBest, setMarkedBest] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selecting phase ──────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartTest = useCallback(() => {
    const chosen = audioVersions.filter((v) => selectedIds.has(v.id));
    const shuffledVersions = shuffle(chosen);
    const options: ShuffledOption[] = shuffledVersions.map((v, i) => ({
      label: `Option ${OPTION_LABELS[i]}`,
      version: v,
    }));
    setShuffled(options);
    setWinnerLabel(null);
    setRevealed(false);
    setMarkedBest(false);
    setPhase("testing");
  }, [audioVersions, selectedIds]);

  // ── Testing phase ────────────────────────────────────────────────────────

  const handleVote = useCallback(
    (label: string) => {
      setWinnerLabel(label);
      // Brief reveal delay for drama
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(() => {
        setRevealed(true);
        setPhase("results");
      }, 800);
    },
    []
  );

  const handleTestAgain = useCallback(() => {
    const chosen = audioVersions.filter((v) => selectedIds.has(v.id));
    const shuffledVersions = shuffle(chosen);
    const options: ShuffledOption[] = shuffledVersions.map((v, i) => ({
      label: `Option ${OPTION_LABELS[i]}`,
      version: v,
    }));
    setShuffled(options);
    setWinnerLabel(null);
    setRevealed(false);
    setMarkedBest(false);
    setPhase("testing");
  }, [audioVersions, selectedIds]);

  // ── Results phase ────────────────────────────────────────────────────────

  const winner = shuffled.find((o) => o.label === winnerLabel);

  const handleMarkBest = useCallback(() => {
    if (!winner) return;
    onMarkBest(winner.version.id);
    setMarkedBest(true);
  }, [winner, onMarkBest]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-zinc-100">
              Blind Test — {trackName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* ── SELECTING PHASE ── */}
          {phase === "selecting" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Pick 2–4 versions with audio to compare. Their identities will be hidden during the test.
              </p>

              <div className="grid gap-2">
                {audioVersions.map((v) => {
                  const isChecked = selectedIds.has(v.id);
                  const disabled = !isChecked && selectedIds.size >= 4;
                  return (
                    <label
                      key={v.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors",
                        isChecked
                          ? "border-violet-500 bg-violet-950/40"
                          : disabled
                          ? "border-zinc-800 bg-zinc-900/40 opacity-40 cursor-not-allowed"
                          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disabled}
                        onChange={() => !disabled && toggleSelect(v.id)}
                        className="accent-violet-500 w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100">
                          Version {v.versionNumber}
                          {v.isBest && (
                            <span className="ml-2 text-xs text-yellow-400">(current best)</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {v.style?.genre || "—"} · {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StarRating value={v.rating} />
                    </label>
                  );
                })}

                {audioVersions.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    No versions with audio found. Upload audio to at least 2 versions first.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-zinc-500">
                  {selectedIds.size} of 4 max selected
                </p>
                <Button
                  onClick={handleStartTest}
                  disabled={selectedIds.size < 2}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Shuffle className="w-4 h-4" />
                  Start Test
                </Button>
              </div>
            </div>
          )}

          {/* ── TESTING PHASE ── */}
          {phase === "testing" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Listen to each option below and click <strong className="text-zinc-200">Vote</strong> for your favourite.
                Version identities are hidden.
              </p>

              <div className="grid gap-4">
                {shuffled.map((option) => {
                  const voted = winnerLabel === option.label;
                  const otherVoted = winnerLabel !== null && winnerLabel !== option.label;
                  return (
                    <div
                      key={option.label}
                      className={cn(
                        "rounded-xl border p-4 space-y-3 transition-all duration-300",
                        voted
                          ? "border-violet-500 bg-violet-950/30 scale-[1.01]"
                          : otherVoted
                          ? "border-zinc-800 bg-zinc-900/20 opacity-50"
                          : "border-zinc-800 bg-zinc-900/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-zinc-100">
                          {option.label}
                        </span>
                        {voted ? (
                          <span className="flex items-center gap-1 text-xs text-violet-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Voted
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(option.label)}
                            disabled={winnerLabel !== null}
                            className="gap-1.5 border-zinc-700 hover:border-violet-500 hover:text-violet-400"
                          >
                            Vote
                          </Button>
                        )}
                      </div>
                      <WaveformPlayer
                        audioUrl={option.version.audioUrl!}
                        fileName={`${option.label}.mp3`}
                      />
                    </div>
                  );
                })}
              </div>

              {winnerLabel && !revealed && (
                <p className="text-center text-sm text-violet-400 animate-pulse">
                  Revealing…
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhase("selecting")}
                  className="gap-1.5 text-zinc-400 hover:text-zinc-100"
                >
                  ← Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAgain}
                  className="gap-1.5 border-zinc-700"
                  disabled={winnerLabel !== null}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reshuffle
                </Button>
              </div>
            </div>
          )}

          {/* ── RESULTS PHASE ── */}
          {phase === "results" && winner && (
            <div className="space-y-6">
              {/* Winner banner */}
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/20 p-5 text-center space-y-1">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Winner</p>
                <p className="text-2xl font-bold text-yellow-300">{winner.label}</p>
                <p className="text-sm text-zinc-300">
                  = <span className="font-semibold">Version {winner.version.versionNumber}</span>
                  {winner.version.isBest && (
                    <span className="ml-1 text-yellow-400">⭐ (already best)</span>
                  )}
                </p>
              </div>

              {/* All reveals */}
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Full reveal</p>
                <div className="grid gap-2">
                  {shuffled.map((option) => {
                    const isWinner = option.label === winnerLabel;
                    return (
                      <div
                        key={option.label}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg border",
                          isWinner
                            ? "border-yellow-500/50 bg-yellow-950/20"
                            : "border-zinc-800 bg-zinc-900/40"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-bold w-16 flex-shrink-0",
                            isWinner ? "text-yellow-300" : "text-zinc-400"
                          )}
                        >
                          {option.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200">
                            Version {option.version.versionNumber}
                          </p>
                          {option.version.prompt && (
                            <p className="text-xs text-zinc-500 truncate">
                              {option.version.prompt.slice(0, 80)}
                              {option.version.prompt.length > 80 ? "…" : ""}
                            </p>
                          )}
                        </div>
                        <StarRating value={option.version.rating} />
                        {isWinner && (
                          <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Winner details */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Winner details</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-zinc-100">
                      Version {winner.version.versionNumber}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {winner.version.style?.genre || "—"}
                      {" · "}
                      Created {new Date(winner.version.createdAt).toLocaleDateString()}
                    </p>
                    {winner.version.prompt && (
                      <p className="text-xs text-zinc-400 italic line-clamp-2">
                        &ldquo;{winner.version.prompt.slice(0, 120)}
                        {winner.version.prompt.length > 120 ? "…" : ""}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StarRating value={winner.version.rating} />
                    {winner.version.isBest && (
                      <span className="text-xs text-yellow-400">Current best ⭐</span>
                    )}
                  </div>
                </div>

                {/* Mark as best button */}
                {!winner.version.isBest && (
                  <div className="pt-2">
                    {markedBest ? (
                      <p className="flex items-center gap-2 text-sm text-yellow-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Marked as best version!
                      </p>
                    ) : (
                      <Button
                        onClick={handleMarkBest}
                        className="gap-2 bg-yellow-600 hover:bg-yellow-500 text-white"
                        size="sm"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        Mark as Best Version
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestAgain}
                  className="gap-1.5 border-zinc-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
