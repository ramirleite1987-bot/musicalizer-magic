"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Music, Check, FileText, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrack } from "@/app/actions/tracks";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PromptTemplate,
} from "@/data/prompt-templates";

interface CreateTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const GENRE_SUGGESTIONS = [
  "Católico",
  "Louvor",
  "Litúrgico",
  "Pop",
  "Cinematic",
  "Folk",
];

// Group templates by category once, preserving the category order (Católico first).
const TEMPLATES_BY_CATEGORY = TEMPLATE_CATEGORIES.map((category) => ({
  category,
  items: PROMPT_TEMPLATES.filter((t) => t.category === category),
})).filter((group) => group.items.length > 0);

export function CreateTrackDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTrackDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      setName("");
      setGenre("");
      setSelectedTemplateId(null);
    }
    onOpenChange(nextOpen);
  };

  const selectTemplate = (template: PromptTemplate) => {
    setSelectedTemplateId(template.id);
    setGenre(template.genre);
  };

  const selectBlank = () => {
    setSelectedTemplateId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const template = selectedTemplateId
      ? PROMPT_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? null
      : null;
    const trimmedGenre = genre.trim() || template?.genre || "General";

    startTransition(async () => {
      try {
        await createTrack({
          name: trimmedName,
          genre: trimmedGenre,
          ...(template
            ? {
                initialVersion: {
                  prompt: template.prompt,
                  negativePrompt: template.negativePrompt,
                  lyrics: template.lyrics ?? "",
                  style: template.style,
                },
              }
            : {}),
        });
        toast.success(t("createTrack.created"), {
          description: template
            ? `${trimmedName} · ${template.label}`
            : trimmedName,
        });
        handleOpenChange(false);
        onCreated?.();
      } catch (err) {
        toast.error(t("createTrack.createFailed"), {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>{t("createTrack.title")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("createTrack.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 space-y-4">
          {/* Track name */}
          <div className="space-y-1.5">
            <Label htmlFor="track-name">{t("createTrack.nameLabel")}</Label>
            <Input
              id="track-name"
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("createTrack.namePlaceholder")}
              disabled={isPending}
              required
            />
          </div>

          {/* Template picker */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <Label className="mb-0">{t("createTrack.templateLabel")}</Label>
              <span className="text-zinc-400 font-normal text-xs">
                (optional)
              </span>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 max-h-[300px] overflow-y-auto space-y-3">
              {/* Blank option */}
              <button
                type="button"
                onClick={selectBlank}
                disabled={isPending}
                className={cn(
                  "w-full text-left rounded-md border p-2.5 transition-colors flex items-center gap-2.5",
                  selectedTemplateId === null
                    ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700"
                )}
              >
                <FileText className="w-4 h-4 shrink-0 text-zinc-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {t("createTrack.blankTrack")}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("createTrack.blankTrackDescription")}
                  </p>
                </div>
                {selectedTemplateId === null && (
                  <Check className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
                )}
              </button>

              {/* Templates grouped by category */}
              {TEMPLATES_BY_CATEGORY.map(({ category, items }) => (
                <section key={category}>
                  <div className="flex items-center gap-2 mb-1.5 px-0.5">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {category}
                    </h4>
                    {category === "Católico" && (
                      <span className="text-[10px] text-violet-500 font-medium">
                        {t("createTrack.featured")}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {items.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => selectTemplate(template)}
                          disabled={isPending}
                          className={cn(
                            "text-left rounded-md border p-2.5 transition-colors",
                            isSelected
                              ? "border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                              {template.label}
                            </span>
                            {isSelected ? (
                              <Check className="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                                {template.genre}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-1.5">
            <Label htmlFor="track-genre">
              {t("createTrack.genreLabel")}{" "}
              <span className="text-zinc-400 font-normal text-xs">({t("common.optional")})</span>
            </Label>
            <Input
              id="track-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder={t("createTrack.genrePlaceholder")}
              disabled={isPending}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GENRE_SUGGESTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  disabled={isPending}
                  className="text-xs px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" size="sm" disabled={isPending} type="button">
                {t("common.cancel")}
              </Button>
            }
          />
          <Button
            size="sm"
            disabled={isPending || !name.trim()}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : null}
            {t("createTrack.createButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
