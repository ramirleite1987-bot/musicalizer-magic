"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Search, X, Music, FileText, Mic2, StickyNote, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Track } from "@/types/music";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VersionMatch {
  versionId: string;
  versionNumber: number;
  snippet: string;
  matchType: "prompt" | "lyrics" | "notes";
}

interface TrackResult {
  track: Track;
  versionMatches: VersionMatch[];
  matchesName: boolean;
  matchesTags: boolean;
}

interface SearchPaletteProps {
  tracks: Track[];
  open: boolean;
  onClose: () => void;
  onSelectResult: (trackId: string, versionId?: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSnippet(text: string, query: string, maxLen = 80): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + query.length + 40);
  const snippet = text.slice(start, end);
  return (start > 0 ? "…" : "") + snippet + (end < text.length ? "…" : "");
}

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

function Highlight({ text, query, className }: HighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-400/30 text-amber-200 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function matchTypeIcon(type: "prompt" | "lyrics" | "notes") {
  switch (type) {
    case "prompt":
      return <FileText className="w-3 h-3 flex-shrink-0 text-violet-400" />;
    case "lyrics":
      return <Mic2 className="w-3 h-3 flex-shrink-0 text-blue-400" />;
    case "notes":
      return <StickyNote className="w-3 h-3 flex-shrink-0 text-green-400" />;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SearchPalette({ tracks, open, onClose, onSelectResult }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setFocusedIndex(0);
      // Focus after the modal animates in
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Search / filter logic
  const results: TrackResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // Show first 5 tracks as "recent"
      return tracks.slice(0, 5).map((track) => ({
        track,
        versionMatches: [],
        matchesName: false,
        matchesTags: false,
      }));
    }

    const out: TrackResult[] = [];

    for (const track of tracks) {
      const matchesName = track.name.toLowerCase().includes(q);
      const matchesTags = track.tags.some((tag) => tag.toLowerCase().includes(q));

      const versionMatches: VersionMatch[] = [];

      for (const v of track.versions) {
        // Check prompt, lyrics, notes — stop after first hit per version
        if (v.prompt?.toLowerCase().includes(q)) {
          versionMatches.push({
            versionId: v.id,
            versionNumber: v.versionNumber,
            snippet: getSnippet(v.prompt, q),
            matchType: "prompt",
          });
        } else if (v.lyrics?.toLowerCase().includes(q)) {
          versionMatches.push({
            versionId: v.id,
            versionNumber: v.versionNumber,
            snippet: getSnippet(v.lyrics, q),
            matchType: "lyrics",
          });
        } else if (v.notes?.toLowerCase().includes(q)) {
          versionMatches.push({
            versionId: v.id,
            versionNumber: v.versionNumber,
            snippet: getSnippet(v.notes, q),
            matchType: "notes",
          });
        }
      }

      if (matchesName || matchesTags || versionMatches.length > 0) {
        out.push({ track, versionMatches: versionMatches.slice(0, 3), matchesName, matchesTags });
      }

      if (out.length >= 5) break;
    }

    return out;
  }, [query, tracks]);

  // Flatten results to a linear list for keyboard navigation
  const flatItems = useMemo(() => {
    const items: { trackId: string; versionId?: string }[] = [];
    for (const result of results) {
      if (result.versionMatches.length === 0) {
        // Track-level item
        items.push({ trackId: result.track.id });
      } else {
        for (const vm of result.versionMatches) {
          items.push({ trackId: result.track.id, versionId: vm.versionId });
        }
      }
    }
    return items;
  }, [results]);

  const handleSelect = useCallback(
    (trackId: string, versionId?: string) => {
      onSelectResult(trackId, versionId);
      onClose();
    },
    [onSelectResult, onClose]
  );

  // Keyboard navigation inside the palette
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[focusedIndex];
        if (item) {
          handleSelect(item.trackId, item.versionId);
        }
        return;
      }
    },
    [open, flatItems, focusedIndex, handleSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [results]);

  // Scroll focused item into view
  useEffect(() => {
    if (!listRef.current) return;
    const focused = listRef.current.querySelector("[data-focused='true']");
    if (focused) {
      focused.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  if (!open) return null;

  const isEmptySearch = query.trim().length > 0 && results.length === 0;
  const showRecent = query.trim().length === 0;

  // Build a flat counter for keyboard focus mapping per item
  let flatIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={cn(
          "fixed left-1/2 top-20 z-50 -translate-x-1/2",
          "w-full max-w-2xl mx-4",
          "rounded-xl border border-zinc-700/80 dark:border-zinc-600/80",
          "bg-zinc-900 dark:bg-zinc-900 shadow-2xl shadow-black/60",
          "animate-in fade-in-0 slide-in-from-top-4 duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700/80">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks, lyrics, prompts…"
            className={cn(
              "flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500",
              "focus:outline-none"
            )}
            autoComplete="off"
            spellCheck={false}
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-600 text-[10px] font-mono text-zinc-500 bg-zinc-800">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {/* Section header */}
          {(showRecent || results.length > 0) && (
            <div className="px-4 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {showRecent ? "Recent tracks" : "Results"}
              </p>
            </div>
          )}

          {/* Empty state */}
          {isEmptySearch && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-400">
                No results for{" "}
                <span className="text-zinc-200 font-medium">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
          )}

          {/* Track groups */}
          {results.map((result) => {
            const { track, versionMatches, matchesName, matchesTags } = result;

            if (versionMatches.length === 0) {
              // Track-level row (name / tag match or recent)
              const thisIdx = flatIdx++;
              const isFocused = focusedIndex === thisIdx;

              return (
                <div key={track.id} className="px-2">
                  <button
                    data-focused={isFocused}
                    onClick={() => handleSelect(track.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      isFocused
                        ? "bg-violet-600/30 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800/60"
                    )}
                  >
                    <Music className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {query.trim() ? (
                            <Highlight text={track.name} query={query.trim()} />
                          ) : (
                            track.name
                          )}
                        </span>
                        {track.genre && (
                          <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400 font-medium">
                            {track.genre}
                          </span>
                        )}
                      </div>
                      {matchesTags && track.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Tag className="w-2.5 h-2.5 text-zinc-500" />
                          <span className="text-xs text-zinc-500 truncate">
                            {track.tags
                              .filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
                              .slice(0, 3)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-zinc-500">
                      {track.versions.length} version{track.versions.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                </div>
              );
            }

            // Group with version matches
            return (
              <div key={track.id} className="px-2 mb-1">
                {/* Track group header */}
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Music className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-300 truncate">
                    {query.trim() && matchesName ? (
                      <Highlight text={track.name} query={query.trim()} />
                    ) : (
                      track.name
                    )}
                  </span>
                  {track.genre && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400 font-medium">
                      {track.genre}
                    </span>
                  )}
                </div>

                {/* Version match rows */}
                {versionMatches.map((vm) => {
                  const thisIdx = flatIdx++;
                  const isFocused = focusedIndex === thisIdx;

                  return (
                    <button
                      key={vm.versionId}
                      data-focused={isFocused}
                      onClick={() => handleSelect(track.id, vm.versionId)}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ml-3",
                        isFocused
                          ? "bg-violet-600/30 text-zinc-100"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                      )}
                    >
                      {matchTypeIcon(vm.matchType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-zinc-300">
                            v{vm.versionNumber}
                          </span>
                          <span className="text-[10px] text-zinc-600 capitalize">
                            {vm.matchType}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                          <Highlight text={vm.snippet} query={query.trim()} />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-700/80 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
            <kbd className="px-1 py-0.5 rounded border border-zinc-700 font-mono bg-zinc-800 text-zinc-500">↑</kbd>
            <kbd className="px-1 py-0.5 rounded border border-zinc-700 font-mono bg-zinc-800 text-zinc-500">↓</kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
            <kbd className="px-1 py-0.5 rounded border border-zinc-700 font-mono bg-zinc-800 text-zinc-500">↵</kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
            <kbd className="px-1 py-0.5 rounded border border-zinc-700 font-mono bg-zinc-800 text-zinc-500">Esc</kbd>
            <span>close</span>
          </div>
        </div>
      </div>
    </>
  );
}
