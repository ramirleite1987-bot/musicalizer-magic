"use client";

import { useState } from "react";
import { Plus, X, Globe, FileText, Loader2, Sparkles, Trash2, Tag } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Track, Theme } from "@/types/music";
import { toast } from "sonner";

const COLOR_OPTIONS = [
  { label: "Blue", value: "blue", className: "bg-blue-500" },
  { label: "Green", value: "green", className: "bg-green-500" },
  { label: "Purple", value: "purple", className: "bg-purple-500" },
  { label: "Red", value: "red", className: "bg-red-500" },
  { label: "Orange", value: "orange", className: "bg-orange-500" },
  { label: "Yellow", value: "yellow", className: "bg-yellow-500" },
  { label: "Pink", value: "pink", className: "bg-pink-500" },
  { label: "Cyan", value: "cyan", className: "bg-cyan-500" },
  { label: "Indigo", value: "indigo", className: "bg-indigo-500" },
  { label: "Teal", value: "teal", className: "bg-teal-500" },
];

const COLOR_MAP: Record<string, string> = Object.fromEntries(
  COLOR_OPTIONS.map(({ value, className }) => [value, className])
);

interface ThemesTabProps {
  track: Track;
  themes: Theme[];
  onAssignTheme: (themeId: string) => void;
  onRemoveTheme: (themeId: string) => void;
  onCreateTheme: (theme: Omit<Theme, "id" | "createdAt">) => void;
  onDeleteTheme: (themeId: string) => void;
  onGenerateThemes: (
    source: "url" | "document",
    content: string
  ) => Promise<Omit<Theme, "id" | "createdAt">[]>;
}

function ThemeCard({
  theme,
  isAssigned,
  onAssign,
  onRemove,
  onDelete,
  showDelete,
}: {
  theme: Theme;
  isAssigned: boolean;
  onAssign: () => void;
  onRemove: () => void;
  onDelete: () => void;
  showDelete: boolean;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-colors",
        isAssigned
          ? "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "w-3 h-3 rounded-full flex-shrink-0",
              COLOR_MAP[theme.color] ?? "bg-zinc-400"
            )}
          />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {theme.name}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAssigned ? (
            <button
              onClick={onRemove}
              className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onAssign}
              className="text-xs text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          {showDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {theme.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
          {theme.description}
        </p>
      )}

      {theme.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {theme.keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {kw}
            </span>
          ))}
          {theme.keywords.length > 4 && (
            <span className="text-[10px] text-zinc-400">
              +{theme.keywords.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ThemesTab({
  track,
  themes,
  onAssignTheme,
  onRemoveTheme,
  onCreateTheme,
  onDeleteTheme,
  onGenerateThemes,
}: ThemesTabProps) {
  const [sourceContent, setSourceContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<Omit<Theme, "id" | "createdAt">[]>([]);

  // Manual creation form
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeDescription, setNewThemeDescription] = useState("");
  const [newThemeKeywords, setNewThemeKeywords] = useState("");
  const [newThemeColor, setNewThemeColor] = useState("blue");

  const assignedThemes = themes.filter((t) => track.themeIds.includes(t.id));
  const unassignedThemes = themes.filter((t) => !track.themeIds.includes(t.id));

  const handleGenerate = async (source: "url" | "document") => {
    if (!sourceContent.trim()) {
      toast.error("Please provide content to analyze");
      return;
    }
    setIsGenerating(true);
    setGeneratedThemes([]);
    try {
      const results = await onGenerateThemes(source, sourceContent);
      setGeneratedThemes(results);
      toast.success(`Generated ${results.length} theme${results.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to generate themes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = (theme: Omit<Theme, "id" | "createdAt">) => {
    onCreateTheme(theme);
    setGeneratedThemes((prev) => prev.filter((t) => t.name !== theme.name));
    toast.success(`Theme "${theme.name}" saved`);
  };

  const handleCreateManual = () => {
    if (!newThemeName.trim()) {
      toast.error("Theme name is required");
      return;
    }
    onCreateTheme({
      name: newThemeName.trim(),
      description: newThemeDescription.trim(),
      keywords: newThemeKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      color: newThemeColor,
      source: "manual",
      sourceRef: "",
    });
    setNewThemeName("");
    setNewThemeDescription("");
    setNewThemeKeywords("");
    setNewThemeColor("blue");
    toast.success("Theme created");
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Assigned themes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-zinc-500" />
            Assigned Themes
            {assignedThemes.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {assignedThemes.length}
              </Badge>
            )}
          </Label>
        </div>

        {assignedThemes.length === 0 ? (
          <div className="py-6 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
            <Tag className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No themes assigned yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Add themes from the library below
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {assignedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isAssigned
                onAssign={() => onAssignTheme(theme.id)}
                onRemove={() => onRemoveTheme(theme.id)}
                onDelete={() => onDeleteTheme(theme.id)}
                showDelete={false}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Generate from source */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-violet-500" />
          Generate Themes with AI
        </Label>

        <Tabs defaultValue="url">
          <TabsList className="w-full">
            <TabsTrigger value="url" className="flex-1 gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              From URL
            </TabsTrigger>
            <TabsTrigger value="document" className="flex-1 gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              From Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3 mt-3">
            <Input
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="https://example.com/article"
              type="url"
            />
            <Button
              onClick={() => handleGenerate("url")}
              disabled={isGenerating}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? "Extracting themes..." : "Extract Themes"}
            </Button>
          </TabsContent>

          <TabsContent value="document" className="space-y-3 mt-3">
            <Textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="Paste text content here — articles, song descriptions, briefs..."
              className="min-h-[120px] resize-none text-sm"
            />
            <Button
              onClick={() => handleGenerate("document")}
              disabled={isGenerating}
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? "Extracting themes..." : "Extract Themes"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Generated themes */}
        {generatedThemes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Generated — click to save
            </p>
            <div className="grid grid-cols-1 gap-2">
              {generatedThemes.map((theme) => (
                <div
                  key={theme.name}
                  className="p-3 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0",
                          COLOR_MAP[theme.color] ?? "bg-zinc-400"
                        )}
                      />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {theme.name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveGenerated(theme)}
                      className="h-6 text-xs px-2 flex-shrink-0"
                    >
                      Save
                    </Button>
                  </div>
                  {theme.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                      {theme.description}
                    </p>
                  )}
                  {theme.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {theme.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Global theme library */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Theme Library
          {themes.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-2">
              {themes.length}
            </Badge>
          )}
        </Label>

        {/* Manual create form */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
          <p className="text-xs font-medium text-zinc-500">Create new theme</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              placeholder="Theme name"
              className="h-8 text-sm"
            />
            <Select value={newThemeColor} onValueChange={(v) => v && setNewThemeColor(v)}>
              <SelectTrigger className="h-8 w-24">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      COLOR_MAP[newThemeColor] ?? "bg-zinc-400"
                    )}
                  />
                  <span className="text-xs capitalize">{newThemeColor}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map(({ label, value, className }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", className)} />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            value={newThemeDescription}
            onChange={(e) => setNewThemeDescription(e.target.value)}
            placeholder="Description (optional)"
            className="h-8 text-sm"
          />
          <Input
            value={newThemeKeywords}
            onChange={(e) => setNewThemeKeywords(e.target.value)}
            placeholder="Keywords (comma separated)"
            className="h-8 text-sm"
          />
          <Button
            onClick={handleCreateManual}
            size="sm"
            variant="outline"
            className="w-full gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Theme
          </Button>
        </div>

        {/* Library list */}
        {themes.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">
            No themes in library yet
          </p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2 pr-2">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isAssigned={track.themeIds.includes(theme.id)}
                  onAssign={() => onAssignTheme(theme.id)}
                  onRemove={() => onRemoveTheme(theme.id)}
                  onDelete={() => onDeleteTheme(theme.id)}
                  showDelete
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
