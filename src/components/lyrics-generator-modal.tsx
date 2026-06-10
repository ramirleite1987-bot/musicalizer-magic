"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateLyrics } from "@/app/actions/ai-suggestions";
import type { TrackStyle } from "@/types/music";

interface LyricsGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (lyrics: string) => void;
  trackName: string;
  prompt: string;
  genre: string;
  style: TrackStyle;
  existingLyrics?: string;
}

export function LyricsGeneratorModal({
  open,
  onClose,
  onApply,
  trackName,
  prompt,
  genre,
  style,
  existingLyrics,
}: LyricsGeneratorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [structure, setStructure] = useState<string | null>(null);

  const runGeneration = useCallback(async () => {
    setIsLoading(true);
    setGeneratedLyrics(null);
    setStructure(null);
    try {
      const result = await generateLyrics({
        trackName,
        prompt,
        genre,
        moods: style.moods ?? [],
        style,
        existingLyrics,
      });
      setGeneratedLyrics(result.lyrics);
      setStructure(result.structure);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Failed to generate lyrics", {
        description: message,
        action: {
          label: "Retry",
          onClick: () => runGeneration(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [trackName, prompt, genre, style, existingLyrics]);

  // Auto-generate when modal opens
  useEffect(() => {
    if (open) {
      runGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleApply = () => {
    if (generatedLyrics) {
      onApply(generatedLyrics);
      onClose();
      toast.success("Lyrics applied", {
        description: "The generated lyrics have been added to the editor.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Lyrics Generator
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <div className="px-6 pb-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm font-medium">Writing lyrics&hellip;</p>
              <p className="text-xs text-zinc-400 text-center max-w-xs">
                Claude is crafting lyrics for <span className="font-semibold text-zinc-600 dark:text-zinc-300">{trackName || "your track"}</span>
              </p>
            </div>
          )}

          {!isLoading && generatedLyrics && (
            <div className="space-y-3">
              {structure && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                >
                  {structure}
                </Badge>
              )}
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 max-h-[400px] overflow-y-auto">
                {generatedLyrics}
              </pre>
            </div>
          )}

          {!isLoading && !generatedLyrics && (
            <div className="flex items-center justify-center py-16 text-zinc-400 text-sm">
              No lyrics generated yet.
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={runGeneration}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
          <button
            onClick={handleApply}
            disabled={!generatedLyrics || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
