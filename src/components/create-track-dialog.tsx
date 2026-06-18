"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Music } from "lucide-react";
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

interface CreateTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const GENRE_SUGGESTIONS = [
  "Pop",
  "Hip Hop",
  "Electronic",
  "Lo-Fi",
  "Cinematic",
  "Jazz",
  "Rock",
  "Ambient",
];

export function CreateTrackDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTrackDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else {
      setName("");
      setGenre("");
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedGenre = genre.trim() || "General";
    if (!trimmedName) return;

    startTransition(async () => {
      try {
        await createTrack({ name: trimmedName, genre: trimmedGenre });
        toast.success(t("createTrack.created"), { description: trimmedName });
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
      <DialogContent className="max-w-md">
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
            {/* Genre suggestions */}
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
