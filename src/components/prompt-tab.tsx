"use client";

import { useState } from "react";
import { History, Sparkles, Loader2, X, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { TrackVersion } from "@/types/music";
import { suggestPromptImprovements } from "@/app/actions/ai-suggestions";
import type { PromptSuggestion } from "@/app/actions/ai-suggestions";
import { toast } from "sonner";

interface PromptTabProps {
  version: TrackVersion;
  history: TrackVersion[];
  onChange: (updates: Partial<TrackVersion>) => void;
}

const MAX_PROMPT_LENGTH = 3000;

export function PromptTab({ version, history, onChange }: PromptTabProps) {
  const [prompt, setPrompt] = useState(version.prompt);
  const [negativePrompt, setNegativePrompt] = useState(version.negativePrompt);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[] | null>(
    null
  );
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    onChange({ prompt: value });
  };

  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
    onChange({ negativePrompt: value });
  };

  const applyFromHistory = (historyVersion: TrackVersion) => {
    setPrompt(historyVersion.prompt);
    setNegativePrompt(historyVersion.negativePrompt);
    onChange({
      prompt: historyVersion.prompt,
      negativePrompt: historyVersion.negativePrompt,
    });
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setSuggestions(null);
    setAppliedIndex(null);
    try {
      const results = await suggestPromptImprovements({
        prompt,
        negativePrompt,
        style: version.style,
        dimensionScores: version.dimensionScores,
        feedback: version.feedback,
        rating: version.rating,
      });
      setSuggestions(results);
    } catch (err) {
      console.error("AI suggestion error:", err);
      toast.error("Failed to generate suggestions. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (suggestion: PromptSuggestion, index: number) => {
    handlePromptChange(suggestion.improvedPrompt);
    setAppliedIndex(index);
    toast.success(`Applied: ${suggestion.title}`);
  };

  const dismissSuggestions = () => {
    setSuggestions(null);
    setAppliedIndex(null);
  };

  const pastVersions = history.filter((v) => v.id !== version.id);

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </Label>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs",
                prompt.length > MAX_PROMPT_LENGTH * 0.9
                  ? "text-red-500"
                  : "text-zinc-400"
              )}
            >
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSuggest}
              disabled={isSuggesting}
              className="h-7 px-2 text-xs gap-1"
            >
              {isSuggesting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isSuggesting ? "Thinking…" : "Suggest with AI"}
            </Button>
          </div>
        </div>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Describe the music you want to create. Be specific about mood, instruments, tempo, and style..."
          className="min-h-[140px] resize-none text-sm leading-relaxed"
          maxLength={MAX_PROMPT_LENGTH}
        />
        <p className="text-xs text-zinc-400">
          A detailed prompt helps Suno generate music that matches your vision.
          Include genre, instruments, mood, tempo, and any specific references.
        </p>
      </div>

      {/* AI Suggestions Panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                AI Suggestions
              </span>
            </div>
            <button
              onClick={dismissSuggestions}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Dismiss suggestions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-md border bg-white dark:bg-zinc-900 p-3 space-y-2 transition-colors",
                  appliedIndex === index
                    ? "border-violet-400 dark:border-violet-600"
                    : "border-zinc-200 dark:border-zinc-700"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                    {suggestion.title}
                  </p>
                  {appliedIndex === index ? (
                    <span className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 shrink-0 font-medium">
                      <Check className="w-3 h-3" />
                      Applied
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(suggestion, index)}
                      className="h-6 px-2 text-xs shrink-0"
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {suggestion.suggestion}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-relaxed line-clamp-2 italic">
                  {suggestion.improvedPrompt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negative Prompt */}
      <div className="space-y-2">
        <Label htmlFor="negative-prompt" className="text-sm font-medium">
          Negative Prompt
        </Label>
        <Textarea
          id="negative-prompt"
          value={negativePrompt}
          onChange={(e) => handleNegativePromptChange(e.target.value)}
          placeholder="Describe what to avoid (e.g., no distorted guitars, avoid heavy metal, no spoken word)..."
          className="min-h-[80px] resize-none text-sm leading-relaxed"
        />
        <p className="text-xs text-zinc-400">
          Tell Suno what elements to avoid in the generated music.
        </p>
      </div>

      {/* History accordion */}
      {pastVersions.length > 0 && (
        <Accordion>
          <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Prompt History
                <Badge variant="secondary" className="text-xs ml-1">
                  {pastVersions.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {pastVersions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        v{v.versionNumber}
                      </span>
                      <button
                        onClick={() => applyFromHistory(v)}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                      >
                        Use this prompt
                      </button>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
                      {v.prompt || <span className="text-zinc-400 italic">No prompt</span>}
                    </p>
                    {v.negativePrompt && (
                      <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed line-clamp-2">
                        <span className="font-medium">Negative: </span>
                        {v.negativePrompt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
