"use client";

import { useRef, useState } from "react";
import {
  Plus, Upload, Star, CheckCircle2, Clock, Loader2, AlertCircle,
  Music2, Trash2, Play, Pause, Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TrackVersion } from "@/types/music";

interface VersionsTabProps {
  versions: TrackVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (id: string) => void;
  onNewVersion: () => void;
  onUploadAudio: (file: File) => void;
  onRemoveAudio: () => void;
}

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: Clock, className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  generating: { label: "Generating", icon: Loader2, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  archived: { label: "Archived", icon: AlertCircle, className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= value ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 dark:text-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

export function VersionsTab({
  versions,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
  onUploadAudio,
  onRemoveAudio,
}: VersionsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadAudio(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      onUploadAudio(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Versions ({versions.length})
        </h3>
        <Button onClick={onNewVersion} size="sm" variant="outline" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          New Version
        </Button>
      </div>

      {/* Versions table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-900">
              <TableHead className="text-xs w-12">#</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Rating</TableHead>
              <TableHead className="text-xs">Genre</TableHead>
              <TableHead className="text-xs">Suno</TableHead>
              <TableHead className="text-xs w-16">Best</TableHead>
              <TableHead className="text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-zinc-400 py-8">
                  No versions yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {versions.map((version) => {
              const isSelected = version.id === selectedVersionId;
              const statusConfig = STATUS_CONFIG[version.status];
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  )}
                >
                  <TableCell className="text-sm font-medium">
                    v{version.versionNumber}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs flex items-center gap-1 w-fit", statusConfig.className)}
                    >
                      <StatusIcon
                        className={cn(
                          "w-3 h-3",
                          version.status === "generating" && "animate-spin"
                        )}
                      />
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StarRating value={version.rating} />
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                    {version.style?.genre || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {(() => {
                      const provider = version.style?.provider ?? "suno";
                      if (provider === "minimax") {
                        return `Minimax ${version.style?.minimaxModel || "music-1.5"}`;
                      }
                      return version.style?.sunoApiVersion || "—";
                    })()}
                  </TableCell>
                  <TableCell>
                    {version.isBest && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Audio section for selected version */}
      {selectedVersion && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Audio — v{selectedVersion.versionNumber}
            </h4>
          </div>

          {selectedVersion.audioUrl ? (
            <div className="space-y-3">
              {/* Audio player */}
              <audio
                ref={audioRef}
                src={selectedVersion.audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {selectedVersion.audioFileName || "audio.mp3"}
                  </p>
                  <p className="text-xs text-zinc-400">v{selectedVersion.versionNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveAudio}
                  className="text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            /* Upload dropzone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Music2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Drop audio file here or{" "}
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  browse
                </span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">MP3, WAV, M4A supported</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Audio
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
