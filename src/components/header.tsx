"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronRight, Clock, CheckCircle2, AlertCircle, Loader2, Download, Upload, Wand2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Track, TrackVersion, Theme } from "@/types/music";
import { exportTrackAsJSON } from "@/lib/track-export";
import { parseTrackImport } from "@/lib/track-export";
import { importTrack } from "@/app/actions/import-track";
import { generateTrackNames } from "@/app/actions/ai-suggestions";
import { toast } from "sonner";

interface HeaderProps {
  track: Track | null;
  version: TrackVersion | null;
  onGenerate: () => void;
  themes?: Theme[];
  onImported?: (newTrackId: string) => void;
  onRenameTrack?: (newName: string) => void;
}

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: Clock, className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  generating: { label: "Generating", icon: Loader2, className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  complete: { label: "Complete", icon: CheckCircle2, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  archived: { label: "Archived", icon: AlertCircle, className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

export function Header({ track, version, onGenerate, themes = [], onImported, onRenameTrack }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // AI name suggestions state
  const [isSuggestingNames, setIsSuggestingNames] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  // Close suggestions on outside click
  useEffect(() => {
    if (nameSuggestions.length === 0) return;
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setNameSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [nameSuggestions]);

  // Close suggestions on Escape
  useEffect(() => {
    if (nameSuggestions.length === 0 && !isEditing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNameSuggestions([]);
        if (isEditing) {
          setIsEditing(false);
          setEditName("");
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nameSuggestions, isEditing]);

  const startEditing = () => {
    if (!track) return;
    setEditName(track.name);
    setNameSuggestions([]);
    setIsEditing(true);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== track?.name && onRenameTrack) {
      onRenameTrack(trimmed);
    }
    setIsEditing(false);
    setEditName("");
    setNameSuggestions([]);
  };

  const cancelRename = () => {
    setIsEditing(false);
    setEditName("");
    setNameSuggestions([]);
  };

  const handleSuggestNames = async () => {
    if (!version) return;
    setIsSuggestingNames(true);
    setNameSuggestions([]);
    try {
      const names = await generateTrackNames({
        prompt: version.prompt,
        negativePrompt: version.negativePrompt,
        style: version.style,
        genre: version.style?.genre,
      });
      if (names.length > 0) {
        // Start editing if not already
        if (!isEditing) {
          setEditName(track?.name ?? "");
          setIsEditing(true);
        }
        setNameSuggestions(names);
      } else {
        toast.error("No suggestions returned", {
          description: "Try adding more details to the prompt.",
        });
      }
    } catch (err) {
      toast.error("Failed to generate name suggestions", {
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    } finally {
      setIsSuggestingNames(false);
    }
  };

  const applySuggestion = (name: string) => {
    setEditName(name);
    setNameSuggestions([]);
    // Auto-commit the suggestion
    if (onRenameTrack) {
      onRenameTrack(name);
    }
    setIsEditing(false);
  };

  const handleExport = () => {
    if (!track) return;
    const themeNames: Record<string, string> = {};
    for (const t of themes) {
      themeNames[t.id] = t.name;
    }
    try {
      exportTrackAsJSON(track, themeNames);
      toast.success("Track exported", {
        description: `${track.name} downloaded as JSON.`,
      });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected if needed
    e.target.value = "";

    setIsImporting(true);
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const parsed = parseTrackImport(json);
      const newTrackId = await importTrack(parsed);
      toast.success("Track imported", {
        description: `"${parsed.name}" created with ${parsed.versions.length} version(s).`,
      });
      onImported?.(newTrackId);
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!track) {
    return (
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-950">
        <p className="text-sm text-zinc-400">Select a track to get started</p>
        {/* Import button available even without a selected track */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Import
          </Button>
        </div>
      </div>
    );
  }

  const status = version?.status ?? "draft";
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const isGenerating = status === "generating";

  return (
    <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white dark:bg-zinc-950 flex-shrink-0">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Breadcrumb / editable track name */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1 relative" ref={suggestionsRef}>
            <div className="flex items-center gap-1">
              <Input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                }}
                className="h-7 text-sm w-48 font-medium"
                placeholder="Track name…"
              />
              {/* AI wand button inside edit mode */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                onClick={handleSuggestNames}
                disabled={isSuggestingNames || !version?.prompt}
                title="Generate name suggestions with AI"
              >
                {isSuggestingNames ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700"
                onClick={commitRename}
                title="Save name"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                onClick={cancelRename}
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Suggestions dropdown */}
            {nameSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-[200px]">
                <p className="text-[10px] text-zinc-400 px-1 pb-1">AI suggestions — click to apply</p>
                {nameSuggestions.map((name) => (
                  <button
                    key={name}
                    onClick={() => applySuggestion(name)}
                    className="text-left text-sm px-2 py-1.5 rounded-md hover:bg-violet-50 dark:hover:bg-violet-950/40 text-zinc-700 dark:text-zinc-200 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 group">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {track.name}
            </span>
            {/* Pencil edit button — always visible, subtle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              onClick={startEditing}
              title="Rename track"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            {/* AI Wand button — only when there's a version with a prompt */}
            {version?.prompt && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
                onClick={handleSuggestNames}
                disabled={isSuggestingNames}
                title="Generate track name suggestions with AI"
              >
                {isSuggestingNames ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wand2 className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        )}
        {version && !isEditing && (
          <>
            <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="text-sm text-zinc-500 flex-shrink-0">
              v{version.versionNumber}
            </span>
          </>
        )}
      </div>

      {/* Right side: badges + action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Status badge */}
        {version && (
          <Badge
            variant="secondary"
            className={cn("flex items-center gap-1 text-xs", statusConfig.className)}
          >
            <StatusIcon className={cn("w-3 h-3", isGenerating && "animate-spin")} />
            {statusConfig.label}
          </Badge>
        )}

        {/* Provider + model badge */}
        {version?.style && (() => {
          const provider = version.style.provider ?? "suno";
          const label =
            provider === "minimax"
              ? `Minimax ${version.style.minimaxModel || "music-1.5"}`
              : `Suno ${version.style.sunoApiVersion || ""}`.trim();
          return (
            <Badge variant="outline" className="text-xs text-zinc-500">
              {label}
            </Badge>
          );
        })()}

        {/* Best version badge */}
        {version?.isBest && (
          <Badge className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
            ★ Best
          </Badge>
        )}

        {/* Export button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExport}
          title="Export track as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>

        {/* Import button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleImportClick}
          disabled={isImporting}
          title="Import track from JSON"
        >
          {isImporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Import
        </Button>

        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="sm"
          className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate
        </Button>
      </div>
    </div>
  );
}
