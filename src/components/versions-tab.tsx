"use client";

import { useRef, useState, useTransition } from "react";
import {
  Plus, Upload, Star, CheckCircle2, Clock, Loader2, AlertCircle,
  Music2, Trash2, Volume2, GitCompare, Download, Archive, ArchiveRestore,
  Eye, EyeOff, Headphones
} from "lucide-react";
import { downloadAudio } from "@/lib/download-audio";
import { WaveformPlayer } from "@/components/waveform-player";
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
import { VersionCompareModal } from "@/components/version-compare-modal";
import { BlindTest } from "@/components/blind-test";
import { archiveVersion, unarchiveVersion } from "@/app/actions/versions";

interface VersionsTabProps {
  versions: TrackVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (id: string) => void;
  onNewVersion: () => void;
  onUploadAudio: (file: File) => void;
  onRemoveAudio: () => void;
  onMarkBest?: (versionId: string) => void;
  trackName?: string;
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
  onMarkBest,
  trackName,
}: VersionsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [showBlindTest, setShowBlindTest] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const audioVersionsCount = versions.filter(
    (v) => v.audioUrl !== null && v.status !== "archived"
  ).length;

  const archivedVersions = versions.filter((v) => v.status === "archived");
  const visibleVersions = showArchived
    ? versions
    : versions.filter((v) => v.status !== "archived");

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

  const handleVersionDownload = async (version: TrackVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!version.audioUrl || downloadingId === version.id) return;
    const safeName = (trackName ?? "track").replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-") || "track";
    const filename = `${safeName}-v${version.versionNumber}.mp3`;
    setDownloadingId(version.id);
    try {
      await downloadAudio(version.audioUrl, filename);
    } catch (err) {
      console.error("Audio download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleArchive = (version: TrackVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingActionId(version.id);
    startTransition(async () => {
      try {
        await archiveVersion(version.id);
        // If the archived version was selected, auto-select first non-archived version
        if (version.id === selectedVersionId) {
          const firstNonArchived = versions.find(
            (v) => v.id !== version.id && v.status !== "archived"
          );
          if (firstNonArchived) {
            onSelectVersion(firstNonArchived.id);
          }
        }
      } catch (err) {
        console.error("Archive failed:", err);
      } finally {
        setPendingActionId(null);
      }
    });
  };

  const handleUnarchive = (version: TrackVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingActionId(version.id);
    startTransition(async () => {
      try {
        await unarchiveVersion(version.id);
      } catch (err) {
        console.error("Unarchive failed:", err);
      } finally {
        setPendingActionId(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Versions ({visibleVersions.length})
        </h3>
        <div className="flex items-center gap-2">
          {archivedVersions.length > 0 && (
            <Button
              onClick={() => setShowArchived((prev) => !prev)}
              size="sm"
              variant="ghost"
              className={cn(
                "gap-1.5 text-xs",
                showArchived
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {showArchived ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {showArchived
                ? "Hide archived"
                : `Show archived (${archivedVersions.length})`}
            </Button>
          )}
          <Button
            onClick={() => setShowBlindTest(true)}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={audioVersionsCount < 2}
            title={
              audioVersionsCount < 2
                ? "Need at least 2 versions with audio"
                : "A/B blind listening test"
            }
          >
            <Headphones className="w-3.5 h-3.5" />
            Blind Test
          </Button>
          <Button
            onClick={() => setCompareOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={versions.length < 2}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Compare
          </Button>
          <Button onClick={onNewVersion} size="sm" variant="outline" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            New Version
          </Button>
        </div>
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
              <TableHead className="text-xs w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleVersions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-zinc-400 py-8">
                  No versions yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {visibleVersions.map((version) => {
              const isSelected = version.id === selectedVersionId;
              const isArchived = version.status === "archived";
              const statusConfig = STATUS_CONFIG[version.status];
              const StatusIcon = statusConfig.icon;
              const isActionPending = isPending && pendingActionId === version.id;

              return (
                <TableRow
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-violet-50 dark:bg-violet-950/30"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    isArchived && "opacity-50"
                  )}
                >
                  <TableCell className={cn("text-sm font-medium", isArchived && "italic")}>
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {version.audioUrl && (
                        <button
                          onClick={(e) => handleVersionDownload(version, e)}
                          disabled={downloadingId === version.id}
                          className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label={`Download v${version.versionNumber}`}
                        >
                          {downloadingId === version.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {/* Archive / Unarchive button — not available for best version */}
                      {!version.isBest && (
                        <button
                          onClick={(e) =>
                            isArchived
                              ? handleUnarchive(version, e)
                              : handleArchive(version, e)
                          }
                          disabled={isActionPending}
                          className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label={
                            isArchived
                              ? `Unarchive v${version.versionNumber}`
                              : `Archive v${version.versionNumber}`
                          }
                          title={isArchived ? "Unarchive" : "Archive"}
                        >
                          {isActionPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isArchived ? (
                            <ArchiveRestore className="w-3 h-3" />
                          ) : (
                            <Archive className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
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
            <div className="space-y-2">
              {/* Waveform player */}
              <WaveformPlayer
                audioUrl={selectedVersion.audioUrl}
                fileName={selectedVersion.audioFileName || "audio.mp3"}
              />
              {/* Version label + remove button */}
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-zinc-400">v{selectedVersion.versionNumber}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemoveAudio}
                  className="text-zinc-400 hover:text-red-500 h-6 px-2"
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

      {/* Version comparison modal */}
      <VersionCompareModal
        versions={versions}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />

      {/* Blind test overlay */}
      {showBlindTest && (
        <BlindTest
          versions={versions}
          trackName={trackName ?? "Track"}
          onMarkBest={(versionId) => {
            onMarkBest?.(versionId);
          }}
          onClose={() => setShowBlindTest(false)}
        />
      )}
    </div>
  );
}
