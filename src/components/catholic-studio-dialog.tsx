"use client";

import { useState } from "react";
import { Church, Loader2, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/i18n/provider";
import { SONG_LANGUAGES, type SongLanguage } from "@/types/music";
import {
  CATHOLIC_THEMES,
  CATHOLIC_STYLE_BLENDS,
  type CatholicThemeId,
} from "@/data/catholic-presets";
import {
  buildCatholicComposition,
  createCatholicTrack,
  type CatholicComposition,
} from "@/app/actions/catholic";

interface CatholicStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (trackId: string) => void;
}

export function CatholicStudioDialog({
  open,
  onOpenChange,
  onCreated,
}: CatholicStudioDialogProps) {
  const { t } = useI18n();
  const [themeId, setThemeId] = useState<CatholicThemeId | null>(null);
  const [blends, setBlends] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [language, setLanguage] = useState<SongLanguage>("pt");
  const [instrumental, setInstrumental] = useState(false);

  const [composition, setComposition] = useState<CatholicComposition | null>(null);
  const [building, setBuilding] = useState(false);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setThemeId(null);
    setBlends([]);
    setKeywords("");
    setInspiration("");
    setLanguage("pt");
    setInstrumental(false);
    setComposition(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggleBlend = (id: string) => {
    setBlends((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const parseList = (raw: string, sep: RegExp): string[] =>
    raw
      .split(sep)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleBuild = async () => {
    if (!themeId) {
      toast.error(t("catholic.selectThemeFirst"));
      return;
    }
    setBuilding(true);
    try {
      const result = await buildCatholicComposition({
        themeId,
        blends,
        keywords: parseList(keywords, /,/),
        inspiration: parseList(inspiration, /\n/),
        language,
        instrumental,
      });
      setComposition(result);
    } catch (err) {
      toast.error(t("catholic.buildFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBuilding(false);
    }
  };

  const handleCreate = async () => {
    if (!themeId || !composition) return;
    setCreating(true);
    try {
      const trackId = await createCatholicTrack({
        themeId,
        name: composition.suggestedName,
        prompt: composition.prompt,
        negativePrompt: composition.negativePrompt,
        lyrics: composition.lyrics,
        language,
        instrumental,
      });
      toast.success(t("catholic.created"), {
        description: composition.suggestedName,
      });
      handleOpenChange(false);
      onCreated?.(trackId);
    } catch (err) {
      toast.error(t("catholic.createFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };

  const updateComposition = (patch: Partial<CatholicComposition>) =>
    setComposition((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
              <Church className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>{t("catholic.title")}</DialogTitle>
          </div>
          <DialogDescription>{t("catholic.subtitle")}</DialogDescription>
          <DialogCloseButton />
        </DialogHeader>

        <div className="px-6 pb-2 space-y-6">
          {/* Step 1 — theme */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("catholic.stepTheme")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATHOLIC_THEMES.map((theme) => {
                const selected = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={cn(
                      "text-left rounded-lg border p-3 transition-colors",
                      selected
                        ? "border-violet-400 bg-violet-50 dark:bg-violet-950/40 dark:border-violet-700"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {t(`catholic.themes.${theme.id}.name`)}
                      </span>
                      {selected && <Check className="w-4 h-4 text-violet-500" />}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t(`catholic.themes.${theme.id}.description`)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — style blends */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("catholic.stepStyles")}</Label>
            <p className="text-xs text-zinc-400">{t("catholic.stepStylesHint")}</p>
            <div className="flex flex-wrap gap-1.5">
              {CATHOLIC_STYLE_BLENDS.map((blend) => {
                const selected = blends.includes(blend.id);
                return (
                  <button
                    key={blend.id}
                    type="button"
                    onClick={() => toggleBlend(blend.id)}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-colors",
                      selected
                        ? "border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    )}
                  >
                    {t(`catholic.styleBlends.${blend.id}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3 — keywords */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("catholic.stepKeywords")}</Label>
            <p className="text-xs text-zinc-400">{t("catholic.stepKeywordsHint")}</p>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t("catholic.keywordsPlaceholder")}
            />
          </div>

          {/* Step 4 — inspiration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("catholic.stepInspiration")}</Label>
            <p className="text-xs text-zinc-400">{t("catholic.stepInspirationHint")}</p>
            <Textarea
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              placeholder={t("catholic.inspirationPlaceholder")}
              rows={3}
            />
          </div>

          {/* Step 5 — language + instrumental */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("catholic.stepLanguage")}</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={language}
                onValueChange={(v) => v && setLanguage(v as SongLanguage)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SONG_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {t(`songLanguage.${lang}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={instrumental}
                  onChange={(e) => setInstrumental(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 accent-violet-600"
                />
                {t("catholic.instrumental")}
              </label>
            </div>
          </div>

          {/* Build button */}
          <Button
            onClick={handleBuild}
            disabled={building || !themeId}
            className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {building ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {building ? t("catholic.building") : composition ? t("catholic.regenerate") : t("catholic.buildButton")}
          </Button>

          {/* Preview (editable) */}
          {composition && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-semibold">{t("catholic.previewTitle")}</Label>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">{t("catholic.namedLabel")}</Label>
                  <Input
                    value={composition.suggestedName}
                    onChange={(e) => updateComposition({ suggestedName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">{t("catholic.promptLabel")}</Label>
                  <Textarea
                    value={composition.prompt}
                    onChange={(e) => updateComposition({ prompt: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">{t("catholic.negativePromptLabel")}</Label>
                  <Input
                    value={composition.negativePrompt}
                    onChange={(e) => updateComposition({ negativePrompt: e.target.value })}
                  />
                </div>

                {!instrumental && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500">{t("catholic.lyricsLabel")}</Label>
                    <Textarea
                      value={composition.lyrics}
                      onChange={(e) => updateComposition({ lyrics: e.target.value })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={creating}
          >
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!composition || creating}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {creating ? t("catholic.creating") : t("catholic.createButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
