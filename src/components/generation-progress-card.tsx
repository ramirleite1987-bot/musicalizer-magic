"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { WaveformPlayer } from "@/components/waveform-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GenerationStatus = "queued" | "generating" | "uploading" | "complete" | "failed";

interface GenerationProgressCardProps {
  versionId: string;
  provider: string;
  model: string;
  versionLabel: string;
  onComplete: (audioUrl: string) => void;
  onDismiss: () => void;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ProviderBadge({ provider }: { provider: string }) {
  const isMinimax = provider.toLowerCase() === "minimax";
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-semibold uppercase tracking-wide",
        isMinimax
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
      )}
    >
      {isMinimax ? "Minimax" : "Suno"}
    </Badge>
  );
}

const STATUS_LABELS: Record<GenerationStatus, string> = {
  queued: "Queued...",
  generating: "Generating...",
  uploading: "Uploading to storage...",
  complete: "Complete!",
  failed: "Failed",
};

function ProgressBar({ status }: { status: GenerationStatus }) {
  const isIndeterminate = status === "queued" || status === "generating";
  const isFailed = status === "failed";

  if (isIndeterminate) {
    return (
      <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className="h-full rounded-full animate-shimmer"
          style={{ width: "60%" }}
        />
      </div>
    );
  }

  const widthMap: Record<GenerationStatus, string> = {
    queued: "60%",
    generating: "60%",
    uploading: "90%",
    complete: "100%",
    failed: "100%",
  };

  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          isFailed ? "bg-red-500" : "bg-violet-500"
        )}
        style={{ width: widthMap[status] }}
      />
    </div>
  );
}

function StatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "queued":
    case "generating":
      return (
        <Loader2 className="w-4 h-4 text-violet-500 animate-spin flex-shrink-0" />
      );
    case "uploading":
      return (
        <Upload className="w-4 h-4 text-violet-400 animate-bounce flex-shrink-0" />
      );
    case "complete":
      return (
        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
      );
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  }
}

export function GenerationProgressCard({
  versionId,
  provider,
  model,
  versionLabel,
  onComplete,
  onDismiss,
}: GenerationProgressCardProps) {
  const [status, setStatus] = useState<GenerationStatus>("queued");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Elapsed time counter — ticks every second
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // Stop elapsed timer when done
  useEffect(() => {
    if (status === "complete" || status === "failed") {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
  }, [status]);

  // Polling loop — every 5 seconds
  useEffect(() => {
    if (completedRef.current) return;

    async function poll() {
      if (completedRef.current) return;

      try {
        const res = await fetch(`/api/generation/${versionId}/status`);
        if (!res.ok) return;
        const data: {
          status?: string;
          audioUrl?: string;
          error?: string;
        } = await res.json();

        const remoteStatus = data.status;

        if (remoteStatus === "complete") {
          completedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Briefly show "uploading" state before complete for a smoother transition
          setStatus("uploading");
          setTimeout(() => {
            setStatus("complete");
            if (data.audioUrl) {
              setAudioUrl(data.audioUrl);
              onComplete(data.audioUrl);
            } else {
              onComplete("");
            }
          }, 800);
        } else if (remoteStatus === "failed") {
          completedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus("failed");
          setErrorMessage(data.error ?? "Generation failed");
        } else if (remoteStatus === "generating") {
          setStatus("generating");
        } else {
          // queued or other pending states
          setStatus("queued");
        }
      } catch {
        // Network error — keep polling, don't fail the card
      }
    }

    // First poll immediately, then every 5s
    poll();
    pollingRef.current = setInterval(poll, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [versionId, onComplete]);

  const isDone = status === "complete" || status === "failed";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm transition-all duration-300",
        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
        "ring-1 ring-inset",
        status === "complete"
          ? "ring-green-200 dark:ring-green-900"
          : status === "failed"
          ? "ring-red-200 dark:ring-red-900"
          : "ring-violet-200 dark:ring-violet-900"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <ProviderBadge provider={provider} />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
            {model}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">
            {versionLabel}
          </span>
        </div>
        <div className="flex items-center gap-3 ml-2">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
          <button
            onClick={onDismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Dismiss progress card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar status={status} />

      {/* Status row */}
      <div className="flex items-center gap-2 mt-2.5">
        <StatusIcon status={status} />
        <span
          className={cn(
            "text-sm font-medium",
            status === "complete"
              ? "text-green-600 dark:text-green-400"
              : status === "failed"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-600 dark:text-zinc-400"
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Error message */}
      {status === "failed" && errorMessage && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 pl-6">
          {errorMessage}
        </p>
      )}

      {/* Audio player on complete */}
      {status === "complete" && audioUrl && (
        <div className="mt-3">
          <WaveformPlayer audioUrl={audioUrl} fileName={`${provider}-generation.mp3`} />
        </div>
      )}

      {/* Dismiss button when done */}
      {isDone && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="h-7 px-3 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
