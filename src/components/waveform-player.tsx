"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Music2 } from "lucide-react";

interface WaveformPlayerProps {
  audioUrl: string;
  fileName?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WaveformPlayer({ audioUrl, fileName }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  // Clean up wavesurfer instance when url changes or on unmount
  useEffect(() => {
    let ws: import("wavesurfer.js").default | null = null;
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;

      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;

        if (cancelled || !containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: "#7c3aed",        // violet-700
          progressColor: "#a78bfa",    // violet-400
          cursorColor: "#ddd6fe",      // violet-200
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 64,
          normalize: true,
          interact: true,
          backend: "WebAudio",
          url: audioUrl,
        });

        wavesurferRef.current = ws;

        ws.on("ready", () => {
          if (cancelled) return;
          setDuration(ws!.getDuration());
          setIsReady(true);
        });

        ws.on("audioprocess", (time: number) => {
          if (cancelled) return;
          setCurrentTime(time);
        });

        ws.on("seeking", (time: number) => {
          if (cancelled) return;
          setCurrentTime(time);
        });

        ws.on("finish", () => {
          if (cancelled) return;
          setIsPlaying(false);
          setCurrentTime(0);
        });

        ws.on("error", () => {
          if (cancelled) return;
          setError(true);
          setIsReady(true); // stop skeleton
        });
      } catch {
        if (!cancelled) {
          setError(true);
          setIsReady(true);
        }
      }
    }

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(false);

    init();

    return () => {
      cancelled = true;
      if (ws) {
        try {
          ws.destroy();
        } catch {
          // ignore
        }
      }
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    if (isPlaying) {
      ws.pause();
    } else {
      ws.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Fallback to plain <audio> on error
  if (error) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <Music2 className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate mb-1">
            {fileName || "audio.mp3"}
          </p>
          <audio
            src={audioUrl}
            controls
            className="w-full h-8"
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-2">
      {/* Waveform container */}
      <div className="relative">
        {/* Skeleton overlay while loading */}
        {!isReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-zinc-800 animate-pulse">
            <span className="text-xs text-zinc-500">Loading waveform…</span>
          </div>
        )}
        <div
          ref={containerRef}
          className={!isReady ? "opacity-0" : "opacity-100"}
          style={{ transition: "opacity 0.3s" }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-300 truncate">
            {fileName || "audio.mp3"}
          </p>
        </div>

        <span className="text-xs text-zinc-400 tabular-nums flex-shrink-0">
          {formatTime(currentTime)}
          {duration > 0 && (
            <span className="text-zinc-600"> / {formatTime(duration)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
