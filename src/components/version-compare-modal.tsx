"use client";

import { useState } from "react";
import { Star, GitCompare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogCloseButton,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TrackVersion, DimensionScores } from "@/types/music";

interface VersionCompareModalProps {
  versions: TrackVersion[];
  open: boolean;
  onClose: () => void;
}

const DIMENSIONS: { key: keyof DimensionScores; label: string }[] = [
  { key: "melody", label: "Melody" },
  { key: "harmony", label: "Harmony" },
  { key: "rhythm", label: "Rhythm" },
  { key: "production", label: "Production" },
  { key: "lyricsFit", label: "Lyrics Fit" },
  { key: "originality", label: "Originality" },
  { key: "emotionalImpact", label: "Emotional Impact" },
];

/** Split text into words and whitespace tokens for word-level diffing */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/);
}

/**
 * Renders a text with amber highlights on words that differ from the other text.
 * Words are compared pairwise by position (simple word-level diff).
 */
function DiffText({ textA, textB, side }: { textA: string; textB: string; side: "a" | "b" }) {
  const wordsA = tokenize(textA);
  const wordsB = tokenize(textB);
  const thisWords = side === "a" ? wordsA : wordsB;
  const otherWords = side === "a" ? wordsB : wordsA;

  // Build a set of "different word positions" — only compare non-whitespace tokens
  const nonWsA = wordsA.filter((w) => w.trim().length > 0);
  const nonWsB = wordsB.filter((w) => w.trim().length > 0);
  const diffSet = new Set<string>();
  const maxLen = Math.max(nonWsA.length, nonWsB.length);
  for (let i = 0; i < maxLen; i++) {
    const wa = nonWsA[i] ?? "";
    const wb = nonWsB[i] ?? "";
    if (wa !== wb) {
      if (side === "a" && wa) diffSet.add(`${i}:${wa}`);
      if (side === "b" && wb) diffSet.add(`${i}:${wb}`);
    }
  }

  // Re-walk through tokens for the current side
  const currentNonWs = side === "a" ? nonWsA : nonWsB;
  let wordIdx = 0;

  return (
    <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {thisWords.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }
        const idx = wordIdx++;
        const isDiff = diffSet.has(`${idx}:${currentNonWs[idx] ?? ""}`);
        void otherWords; // silence unused warning
        return (
          <span
            key={i}
            className={
              isDiff
                ? "bg-amber-500/20 text-amber-300 rounded px-0.5"
                : "text-zinc-200"
            }
          >
            {token}
          </span>
        );
      })}
    </span>
  );
}

function StyleRow({
  label,
  valueA,
  valueB,
}: {
  label: string;
  valueA: string;
  valueB: string;
}) {
  const differ = valueA !== valueB;
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2 py-1.5 border-b border-zinc-800 last:border-0">
      <div className={cn("text-sm", differ ? "bg-amber-500/20 text-amber-300 rounded px-1" : "text-zinc-300")}>
        {valueA || <span className="text-zinc-600 italic">—</span>}
      </div>
      <div className={cn("text-sm", differ ? "bg-amber-500/20 text-amber-300 rounded px-1" : "text-zinc-300")}>
        {valueB || <span className="text-zinc-600 italic">—</span>}
      </div>
    </div>
  );
}

function StarDisplay({ value, highlight }: { value: number; highlight: "gold" | "none" }) {
  return (
    <div className={cn("flex items-center gap-0.5 rounded px-1 py-0.5 w-fit", highlight === "gold" && "bg-yellow-500/20")}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= value
              ? highlight === "gold"
                ? "text-yellow-400 fill-yellow-400"
                : "text-yellow-600 fill-yellow-600"
              : "text-zinc-700"
          )}
        />
      ))}
      <span className={cn("text-xs ml-1", highlight === "gold" ? "text-yellow-300" : "text-zinc-500")}>
        {value}/5
      </span>
    </div>
  );
}

export function VersionCompareModal({ versions, open, onClose }: VersionCompareModalProps) {
  const [versionAId, setVersionAId] = useState<string>(versions[0]?.id ?? "");
  const [versionBId, setVersionBId] = useState<string>(versions[1]?.id ?? "");

  const versionA = versions.find((v) => v.id === versionAId) ?? null;
  const versionB = versions.find((v) => v.id === versionBId) ?? null;

  const styleA = versionA?.style;
  const styleB = versionB?.style;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-violet-400" />
            Version Comparison
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        {/* Version selectors */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Version A</p>
            <Select
              value={versionAId}
              onValueChange={(val: string | null) => { if (val) setVersionAId(val); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select version A" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.style?.genre || "No genre"}{v.isBest ? " ★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Version B</p>
            <Select
              value={versionBId}
              onValueChange={(val: string | null) => { if (val) setVersionBId(val); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select version B" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.versionNumber} — {v.style?.genre || "No genre"}{v.isBest ? " ★" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {versionA && versionB ? (
          <div className="px-6 pb-6 space-y-6">
            {/* Column headers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-violet-950/30 border border-violet-800/40 px-3 py-2">
                <p className="text-sm font-semibold text-violet-300">v{versionA.versionNumber}</p>
                <p className="text-xs text-zinc-500">{new Date(versionA.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-lg bg-blue-950/30 border border-blue-800/40 px-3 py-2">
                <p className="text-sm font-semibold text-blue-300">v{versionB.versionNumber}</p>
                <p className="text-xs text-zinc-500">{new Date(versionB.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Prompt */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Prompt</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-[80px]">
                  <DiffText textA={versionA.prompt} textB={versionB.prompt} side="a" />
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-[80px]">
                  <DiffText textA={versionA.prompt} textB={versionB.prompt} side="b" />
                </div>
              </div>
            </section>

            {/* Negative Prompt */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Negative Prompt</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-[60px]">
                  {versionA.negativePrompt ? (
                    <DiffText textA={versionA.negativePrompt} textB={versionB.negativePrompt} side="a" />
                  ) : (
                    <span className="text-zinc-600 text-sm italic">—</span>
                  )}
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-[60px]">
                  {versionB.negativePrompt ? (
                    <DiffText textA={versionA.negativePrompt} textB={versionB.negativePrompt} side="b" />
                  ) : (
                    <span className="text-zinc-600 text-sm italic">—</span>
                  )}
                </div>
              </div>
            </section>

            {/* Style */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Style</h3>
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-0.5">
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2 pb-1.5 border-b border-zinc-700 mb-1">
                  <span className="text-xs font-medium text-zinc-500">Field</span>
                  <span className="text-xs font-medium text-violet-400">v{versionA.versionNumber}</span>
                  <span className="text-xs font-medium text-blue-400">v{versionB.versionNumber}</span>
                </div>
                {[
                  { label: "Genre", a: styleA?.genre ?? "", b: styleB?.genre ?? "" },
                  { label: "Moods", a: (styleA?.moods ?? []).join(", "), b: (styleB?.moods ?? []).join(", ") },
                  { label: "Tempo", a: styleA?.tempo ? `${styleA.tempo} BPM` : "", b: styleB?.tempo ? `${styleB.tempo} BPM` : "" },
                  { label: "Key", a: styleA?.key ? `${styleA.key} ${styleA.isMinor ? "minor" : "major"}` : "", b: styleB?.key ? `${styleB.key} ${styleB.isMinor ? "minor" : "major"}` : "" },
                  { label: "Provider", a: styleA?.provider ?? "suno", b: styleB?.provider ?? "suno" },
                ].map(({ label, a, b }) => (
                  <div key={label} className="grid grid-cols-[80px_1fr_1fr] gap-2 py-1.5 border-b border-zinc-800 last:border-0 items-start">
                    <span className="text-xs text-zinc-500 pt-0.5">{label}</span>
                    <div className={cn("text-sm rounded px-1", a !== b ? "bg-amber-500/20 text-amber-300" : "text-zinc-300")}>
                      {a || <span className="text-zinc-600 italic">—</span>}
                    </div>
                    <div className={cn("text-sm rounded px-1", a !== b ? "bg-amber-500/20 text-amber-300" : "text-zinc-300")}>
                      {b || <span className="text-zinc-600 italic">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Evaluation Scores */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Evaluation Scores</h3>
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-0.5">
                <div className="grid grid-cols-[120px_1fr_1fr] gap-2 pb-1.5 border-b border-zinc-700 mb-1">
                  <span className="text-xs font-medium text-zinc-500">Dimension</span>
                  <span className="text-xs font-medium text-violet-400">v{versionA.versionNumber}</span>
                  <span className="text-xs font-medium text-blue-400">v{versionB.versionNumber}</span>
                </div>
                {DIMENSIONS.map(({ key, label }) => {
                  const scoreA = versionA.dimensionScores[key] ?? 0;
                  const scoreB = versionB.dimensionScores[key] ?? 0;
                  const aWins = scoreA > scoreB;
                  const bWins = scoreB > scoreA;
                  return (
                    <div key={key} className="grid grid-cols-[120px_1fr_1fr] gap-2 py-1.5 border-b border-zinc-800 last:border-0 items-center">
                      <span className="text-xs text-zinc-500">{label}</span>
                      <div className={cn(
                        "flex items-center gap-2 rounded px-1.5 py-0.5",
                        aWins ? "bg-green-500/10" : bWins ? "bg-red-500/10" : ""
                      )}>
                        <span className={cn(
                          "text-sm font-mono font-semibold",
                          aWins ? "text-green-400" : bWins ? "text-red-400" : "text-zinc-400"
                        )}>
                          {scoreA}
                        </span>
                        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", aWins ? "bg-green-500" : bWins ? "bg-red-500" : "bg-zinc-500")}
                            style={{ width: `${(scoreA / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 rounded px-1.5 py-0.5",
                        bWins ? "bg-green-500/10" : aWins ? "bg-red-500/10" : ""
                      )}>
                        <span className={cn(
                          "text-sm font-mono font-semibold",
                          bWins ? "text-green-400" : aWins ? "text-red-400" : "text-zinc-400"
                        )}>
                          {scoreB}
                        </span>
                        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", bWins ? "bg-green-500" : aWins ? "bg-red-500" : "bg-zinc-500")}
                            style={{ width: `${(scoreB / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Rating */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Overall Rating</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 flex items-center">
                  <StarDisplay
                    value={versionA.rating}
                    highlight={versionA.rating > versionB.rating ? "gold" : "none"}
                  />
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 flex items-center">
                  <StarDisplay
                    value={versionB.rating}
                    highlight={versionB.rating > versionA.rating ? "gold" : "none"}
                  />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="px-6 pb-6 text-center text-zinc-500 text-sm py-8">
            Select two versions above to compare them.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
