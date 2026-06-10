"use client";

import { useState } from "react";
import { Star, Trophy, TrendingUp, TrendingDown, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TrackVersion, DimensionScores } from "@/types/music";
import { RadarChart } from "@/components/radar-chart";
import { autoEvaluate } from "@/app/actions/ai-suggestions";

interface EvaluateTabProps {
  version: TrackVersion;
  bestVersion: TrackVersion | null;
  trackName: string;
  onChange: (updates: Partial<TrackVersion>) => void;
  onMarkBest: () => void;
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

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              star <= (hovered || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-zinc-200 dark:text-zinc-700"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
          {value}/5
        </span>
      )}
    </div>
  );
}

interface AiEvalResult {
  scores: DimensionScores;
  justifications: Record<string, string>;
  overallNotes: string;
}

export function EvaluateTab({ version, bestVersion, trackName, onChange, onMarkBest }: EvaluateTabProps) {
  const scores = version.dimensionScores;
  const feedback = version.feedback;

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiResult, setAiResult] = useState<AiEvalResult | null>(null);

  const updateDimension = (key: keyof DimensionScores, value: number) => {
    onChange({ dimensionScores: { ...scores, [key]: value } });
  };

  const updateFeedback = (key: keyof typeof feedback, value: string) => {
    onChange({ feedback: { ...feedback, [key]: value } });
  };

  const handleAiEvaluate = async () => {
    setIsEvaluating(true);
    setAiResult(null);
    try {
      const result = await autoEvaluate({
        prompt: version.prompt,
        negativePrompt: version.negativePrompt,
        lyrics: version.lyrics,
        style: version.style,
        trackName,
      });
      setAiResult(result);
    } catch (err) {
      toast.error("AI evaluation failed. Please try again.");
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAcceptAll = () => {
    if (!aiResult) return;
    onChange({
      dimensionScores: aiResult.scores,
      notes: aiResult.overallNotes,
    });
    setAiResult(null);
    toast.success("AI scores applied!");
  };

  const avgScore =
    DIMENSIONS.reduce((sum, { key }) => sum + (scores[key] ?? 0), 0) /
    DIMENSIONS.length;

  const bestAvg = bestVersion
    ? DIMENSIONS.reduce((sum, { key }) => sum + (bestVersion.dimensionScores[key] ?? 0), 0) /
      DIMENSIONS.length
    : null;

  const isBetter = bestAvg !== null && avgScore > bestAvg;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Overall rating */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Overall Rating</Label>
        <StarRatingInput
          value={version.rating}
          onChange={(v) => onChange({ rating: v })}
        />
      </div>

      <Separator />

      {/* Mark as best */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {version.isBest ? "This is the best version" : "Mark as best version"}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {version.isBest
              ? "This version is marked as the best take"
              : "Flag this version as your top pick"}
          </p>
        </div>
        <Button
          onClick={() => {
            const marking = !version.isBest;
            onMarkBest();
            if (marking) fireConfetti();
          }}
          variant={version.isBest ? "secondary" : "outline"}
          size="sm"
          className={cn(
            "gap-1.5",
            version.isBest &&
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          {version.isBest ? "Unmark" : "Mark Best"}
        </Button>
      </div>

      <Separator />

      {/* Radar Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Score Overview
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiEvaluate}
            disabled={isEvaluating}
            className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
          >
            {isEvaluating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isEvaluating ? "Evaluating…" : "✨ AI Evaluate"}
          </Button>
        </div>

        {/* AI Evaluation Results Panel */}
        {aiResult && (
          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                AI Evaluation Suggestions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                >
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAiResult(null)}
                  className="h-7 px-3 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {DIMENSIONS.map(({ key, label }) => (
                <div key={key} className="flex items-start gap-3">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 w-28 flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                    >
                      {aiResult.scores[key]}/10
                    </Badge>
                  </div>
                  {aiResult.justifications[key] && (
                    <p className="text-xs italic text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {aiResult.justifications[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {aiResult.overallNotes && (
              <div className="pt-2 border-t border-violet-200 dark:border-violet-800">
                <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-1">Overall Notes</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                  {aiResult.overallNotes}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Dimension Scores</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Avg: {avgScore.toFixed(1)}/10
            </Badge>
            {bestAvg !== null && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs gap-1",
                  isBetter
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                )}
              >
                {isBetter ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                vs best: {bestAvg.toFixed(1)}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex justify-center py-2">
          <RadarChart
            scores={scores}
            bestScores={
              bestVersion && bestVersion.id !== version.id
                ? bestVersion.dimensionScores
                : undefined
            }
            size={280}
          />
        </div>

        {/* Dimension sliders */}
        <div className="space-y-4">
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </Label>
                <span className="text-xs font-mono text-zinc-500">
                  {scores[key] ?? 0}/10
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Slider
                  value={[scores[key] ?? 0]}
                  onValueChange={(v) => updateDimension(key, Array.isArray(v) ? v[0] : v)}
                  min={0}
                  max={10}
                  step={0.5}
                  className="flex-1"
                />
                <div className="w-24 flex-shrink-0">
                  <Progress
                    value={((scores[key] ?? 0) / 10) * 100}
                    className="h-1.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Structured feedback */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Structured Feedback</Label>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-green-600 dark:text-green-400">
            Music — What works
          </Label>
          <Textarea
            value={feedback.musicPositives}
            onChange={(e) => updateFeedback("musicPositives", e.target.value)}
            placeholder="What works well musically? (melody, production, arrangement...)"
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-red-600 dark:text-red-400">
            Music — What doesn&apos;t work
          </Label>
          <Textarea
            value={feedback.musicNegatives}
            onChange={(e) => updateFeedback("musicNegatives", e.target.value)}
            placeholder="What could be improved musically?"
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-green-600 dark:text-green-400">
            Lyrics — What works
          </Label>
          <Textarea
            value={feedback.lyricsPositives}
            onChange={(e) => updateFeedback("lyricsPositives", e.target.value)}
            placeholder="What works well in the lyrics?"
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-red-600 dark:text-red-400">
            Lyrics — What doesn&apos;t work
          </Label>
          <Textarea
            value={feedback.lyricsNegatives}
            onChange={(e) => updateFeedback("lyricsNegatives", e.target.value)}
            placeholder="What could be improved in the lyrics?"
            className="min-h-[80px] resize-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Things to avoid in future versions
          </Label>
          <Textarea
            value={feedback.thingsToAvoid}
            onChange={(e) => updateFeedback("thingsToAvoid", e.target.value)}
            placeholder="List elements to avoid in the next generation..."
            className="min-h-[80px] resize-none text-sm"
          />
        </div>
      </div>

      {/* Comparison panel */}
      {bestVersion && bestVersion.id !== version.id && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Comparison with Best Version (v{bestVersion.versionNumber})
            </Label>
            <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
              {DIMENSIONS.map(({ key, label }) => {
                const curr = scores[key] ?? 0;
                const best = bestVersion.dimensionScores[key] ?? 0;
                const diff = curr - best;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 w-28 flex-shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs font-mono w-8 text-right">{curr}</span>
                      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${(curr / 10) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${(best / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8">{best}</span>
                      <span
                        className={cn(
                          "text-xs font-mono w-8 text-right",
                          diff > 0
                            ? "text-green-600 dark:text-green-400"
                            : diff < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-zinc-400"
                        )}
                      >
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
