"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PromptTemplate,
} from "@/data/prompt-templates";
import type { TrackStyle } from "@/types/music";

interface PromptTemplatesPanelProps {
  onApply: (
    prompt: string,
    negativePrompt: string,
    style: Partial<TrackStyle>
  ) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronic:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "Hip-Hop":
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  Cinematic:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  Rock: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  Jazz: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Latin:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
};

export function PromptTemplatesPanel({
  onApply,
  onClose,
}: PromptTemplatesPanelProps) {
  const [search, setSearch] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus search on open
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const lowerSearch = search.toLowerCase().trim();
  const filteredTemplates = lowerSearch
    ? PROMPT_TEMPLATES.filter(
        (t) =>
          t.label.toLowerCase().includes(lowerSearch) ||
          t.category.toLowerCase().includes(lowerSearch) ||
          t.genre.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          t.prompt.toLowerCase().includes(lowerSearch)
      )
    : PROMPT_TEMPLATES;

  const handleApply = (template: PromptTemplate) => {
    onApply(template.prompt, template.negativePrompt, template.style);
    setAppliedId(template.id);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  // Group by category
  const grouped = TEMPLATE_CATEGORIES.reduce<
    Record<string, PromptTemplate[]>
  >((acc, cat) => {
    const items = filteredTemplates.filter((t) => t.category === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {});

  const hasResults = Object.keys(grouped).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Prompt Templates Library"
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-lg bg-background border-l border-border shadow-2xl animate-in slide-in-from-right-full duration-300"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
          <BookOpen className="w-5 h-5 text-violet-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground leading-tight">
              Prompt Templates
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {PROMPT_TEMPLATES.length} genre presets — click Apply to load
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close templates panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by genre, mood, or keyword..."
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p>No templates match &quot;{search}&quot;</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {TEMPLATE_CATEGORIES.map((cat) => {
                const items = grouped[cat];
                if (!items) return null;
                return (
                  <section key={cat}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {cat}
                      </h3>
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-xs text-muted-foreground">
                        {items.length}
                      </span>
                    </div>

                    {/* Template cards */}
                    <div className="space-y-2">
                      {items.map((template) => {
                        const isApplied = appliedId === template.id;
                        return (
                          <div
                            key={template.id}
                            className={cn(
                              "rounded-lg border p-3.5 transition-colors bg-card",
                              isApplied
                                ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                                : "border-border hover:border-border/80 hover:bg-muted/30"
                            )}
                          >
                            {/* Card header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="text-sm font-semibold text-foreground leading-snug">
                                  {template.label}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs px-1.5 py-0 h-5 border shrink-0",
                                    CATEGORY_COLORS[template.category] ?? ""
                                  )}
                                >
                                  {template.genre}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant={isApplied ? "default" : "outline"}
                                onClick={() => handleApply(template)}
                                className={cn(
                                  "h-6 px-2.5 text-xs shrink-0",
                                  isApplied &&
                                    "bg-violet-600 hover:bg-violet-700 text-white border-violet-600"
                                )}
                              >
                                {isApplied ? "Applied!" : "Apply"}
                              </Button>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground leading-relaxed mb-1.5 line-clamp-1">
                              {template.description}
                            </p>

                            {/* Prompt preview */}
                            <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2 italic">
                              {template.prompt}
                            </p>

                            {/* Style chips */}
                            {template.style.moods &&
                              template.style.moods.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.style.moods.map((mood) => (
                                    <span
                                      key={mood}
                                      className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                                    >
                                      {mood}
                                    </span>
                                  ))}
                                  {template.style.tempo && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-mono">
                                      {template.style.tempo} BPM
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] border border-border">
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </>
  );
}
