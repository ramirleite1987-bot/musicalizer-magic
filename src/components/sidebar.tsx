"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Music, Search, Star, Plus, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Track, Theme } from "@/types/music";

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
};

interface SidebarProps {
  tracks: Track[];
  themes: Theme[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onCreateTrack: (data: { name: string; genre: string }) => void;
  onUpdateTrack: (id: string, data: { name?: string; genre?: string }) => void;
  onDeleteTrack: (id: string) => void;
}

function CreateTrackDialogContent({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; genre: string }) => void;
}) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("Electronic");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate({ name: name.trim(), genre });
      onClose();
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Create New Track</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Track Name
        </label>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Track"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Genre
        </label>
        <Select value={genre} onValueChange={(v) => v && setGenre(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "Electronic",
              "Pop",
              "Rock",
              "Hip-Hop",
              "R&B",
              "Jazz",
              "Classical",
              "Indie",
              "Ambient",
              "Cinematic",
              "Country",
              "Folk",
            ].map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Create Track
        </Button>
      </div>
    </div>
  );
}

function EditTrackDialogContent({
  track,
  onClose,
  onUpdate,
  onDelete,
}: {
  track: Track;
  onClose: () => void;
  onUpdate: (id: string, data: { name?: string; genre?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(track.name);
  const [genre, setGenre] = useState(track.genre);
  const [showDelete, setShowDelete] = useState(false);

  const handleSave = () => {
    if (name.trim() && (name.trim() !== track.name || genre !== track.genre)) {
      onUpdate(track.id, { name: name.trim(), genre });
    }
    onClose();
  };

  const handleDelete = () => {
    onDelete(track.id);
    onClose();
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Edit Track</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Track Name
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Genre
        </label>
        <Select value={genre} onValueChange={(v) => v && setGenre(v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "Electronic",
              "Pop",
              "Rock",
              "Hip-Hop",
              "R&B",
              "Jazz",
              "Classical",
              "Indie",
              "Ambient",
              "Cinematic",
              "Country",
              "Folk",
            ].map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => setShowDelete(true)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            Save
          </Button>
        </div>
      </div>
      {showDelete && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            Delete &ldquo;{track.name}&rdquo;? This will remove all versions.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              Delete Track
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DialogBackdrop({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

function DialogContent({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return createPortal(
    <DialogBackdrop onClose={onClose}>
      <div
        className="fixed inset-0 z-50 flex min-h-full items-center justify-center p-4 animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm rounded-lg border border-border bg-popover p-6 shadow-lg">
          {children}
        </div>
      </div>
    </DialogBackdrop>,
    document.body
  );
}

export function Sidebar({
  tracks,
  themes,
  selectedTrackId,
  onSelectTrack,
  onCreateTrack,
  onUpdateTrack,
  onDeleteTrack,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTheme =
      themeFilter === "all" || track.themeIds.includes(themeFilter);
    return matchesSearch && matchesTheme;
  });

  const getTrackRating = (track: Track) => {
    const bestVersion = track.versions.find((v) => v.isBest);
    if (bestVersion) return bestVersion.rating;
    const ratings = track.versions.map((v) => v.rating).filter((r) => r > 0);
    if (ratings.length === 0) return 0;
    return Math.max(...ratings);
  };

  const getTrackStatus = (track: Track) => {
    if (track.versions.some((v) => v.status === "generating"))
      return "generating";
    if (track.versions.some((v) => v.status === "complete"))
      return "complete";
    if (track.versions.length > 0)
      return track.versions[track.versions.length - 1].status;
    return "draft";
  };

  const getThemeById = (id: string) => themes.find((t) => t.id === id);

  return (
    <>
      <div className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full bg-white dark:bg-zinc-950">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                Musicalizer Magic
              </span>
            </div>
            <Button
              size="icon-xs"
              variant="ghost"
              className="h-6 w-6"
              title="Create track"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Theme filter */}
          <Select
            value={themeFilter}
            onValueChange={(v) => v && setThemeFilter(v)}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Filter by theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All themes</SelectItem>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        COLOR_MAP[theme.color] ?? "bg-zinc-400"
                      )}
                    />
                    {theme.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Track count */}
        <div className="px-3 pb-1 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Track List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredTracks.map((track) => {
              const rating = getTrackRating(track);
              const status = getTrackStatus(track);
              const isSelected = track.id === selectedTrackId;
              const trackThemes = track.themeIds
                .map(getThemeById)
                .filter(Boolean) as Theme[];

              return (
                <div
                  key={track.id}
                  className={cn(
                    "group relative rounded-lg transition-colors",
                    isSelected
                      ? "bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent"
                  )}
                >
                  <button
                    onClick={() => onSelectTrack(track.id)}
                    className="w-full text-left px-3 py-2.5 pr-8"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium leading-tight truncate",
                          isSelected
                            ? "text-violet-700 dark:text-violet-300"
                            : "text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        {track.name}
                      </span>
                      {rating > 0 && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-zinc-500">{rating}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-500">
                          {track.genre}
                        </span>
                        {status === "generating" && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          >
                            gen
                          </Badge>
                        )}
                      </div>

                      {/* Theme dots */}
                      {trackThemes.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          {trackThemes.slice(0, 3).map((theme) => (
                            <div
                              key={theme.id}
                              title={theme.name}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                COLOR_MAP[theme.color] ?? "bg-zinc-400"
                              )}
                            />
                          ))}
                          {trackThemes.length > 3 && (
                            <span className="text-[10px] text-zinc-400">
                              +{trackThemes.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-zinc-400">
                      {track.versions.length} version
                      {track.versions.length !== 1 ? "s" : ""}
                    </div>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTrack(track);
                    }}
                    className="absolute right-1.5 top-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <Pencil className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              );
            })}

            {filteredTracks.length === 0 && (
              <div className="py-8 text-center text-sm text-zinc-400">
                No tracks found
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Create Track Dialog */}
      {showCreateDialog && (
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <CreateTrackDialogContent
            onClose={() => setShowCreateDialog(false)}
            onCreate={onCreateTrack}
          />
        </DialogContent>
      )}

      {/* Edit Track Dialog */}
      {editingTrack && (
        <DialogContent onClose={() => setEditingTrack(null)}>
          <EditTrackDialogContent
            track={editingTrack}
            onClose={() => setEditingTrack(null)}
            onUpdate={onUpdateTrack}
            onDelete={onDeleteTrack}
          />
        </DialogContent>
      )}
    </>
  );
}