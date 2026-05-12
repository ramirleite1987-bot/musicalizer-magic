"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Music2,
  Plus,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buildStylePromptExtraction,
  type ExternalStyleReference,
} from "@/lib/music/style-prompt-extractor";
import { cn } from "@/lib/utils";
import type { Track, TrackVersion } from "@/types/music";

interface StylePromptExtractorTabProps {
  track: Track;
  selectedVersion: TrackVersion;
  onChange: (updates: Partial<TrackVersion>) => void;
}

interface EditableExternalReference extends ExternalStyleReference {
  id: string;
}

let externalReferenceId = 0;

function createExternalReference(): EditableExternalReference {
  externalReferenceId += 1;
  return {
    id: `external-reference-${externalReferenceId}`,
    title: "",
    artist: "",
    url: "",
    notes: "",
  };
}

export function StylePromptExtractorTab({
  track,
  selectedVersion,
  onChange,
}: StylePromptExtractorTabProps) {
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([
    selectedVersion.id,
  ]);
  const [externalReferences, setExternalReferences] = useState<
    EditableExternalReference[]
  >(() => [createExternalReference()]);

  const selectedVersions = useMemo(() => {
    const selectedIds = new Set(selectedVersionIds);
    return track.versions.filter((version) => selectedIds.has(version.id));
  }, [selectedVersionIds, track.versions]);

  const extraction = useMemo(
    () =>
      buildStylePromptExtraction({
        appSources: selectedVersions.map((version) => ({
          trackName: track.name,
          trackGenre: track.genre,
          version,
        })),
        externalSources: externalReferences,
      }),
    [externalReferences, selectedVersions, track.genre, track.name]
  );

  const toggleVersion = (versionId: string) => {
    setSelectedVersionIds((current) =>
      current.includes(versionId)
        ? current.filter((id) => id !== versionId)
        : [...current, versionId]
    );
  };

  const updateExternalReference = (
    id: string,
    updates: Partial<ExternalStyleReference>
  ) => {
    setExternalReferences((current) =>
      current.map((reference) =>
        reference.id === id ? { ...reference, ...updates } : reference
      )
    );
  };

  const addExternalReference = () => {
    setExternalReferences((current) => [...current, createExternalReference()]);
  };

  const removeExternalReference = (id: string) => {
    setExternalReferences((current) =>
      current.length === 1
        ? [createExternalReference()]
        : current.filter((reference) => reference.id !== id)
    );
  };

  const copyPrompt = async () => {
    if (!extraction.prompt) return;

    try {
      await navigator.clipboard.writeText(extraction.prompt);
      toast.success("Style prompt copied");
    } catch {
      toast.error("Could not copy prompt");
    }
  };

  const applyPrompt = () => {
    if (!extraction.prompt) return;

    onChange({
      prompt: extraction.prompt,
      ...(extraction.negativePrompt
        ? { negativePrompt: extraction.negativePrompt }
        : {}),
    });
    toast.success("Applied to current version");
  };

  return (
    <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <section className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">App songs</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {selectedVersions.length}/{track.versions.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {track.versions.map((version) => {
              const checked = selectedVersionIds.includes(version.id);

              return (
                <label
                  key={version.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVersion(version.id)}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {track.name} v{version.versionNumber}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {version.style.genre} · {version.style.tempo} BPM ·{" "}
                      {version.prompt || "No prompt"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">External references</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExternalReference}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {externalReferences.map((reference, index) => (
              <div
                key={reference.id}
                className="rounded-md border border-border bg-muted/20 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Badge variant="secondary" className="text-xs">
                    Reference {index + 1}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExternalReference(reference.id)}
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${reference.id}-title`}>Title</Label>
                    <Input
                      id={`${reference.id}-title`}
                      value={reference.title ?? ""}
                      onChange={(event) =>
                        updateExternalReference(reference.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Song title"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${reference.id}-artist`}>Artist</Label>
                    <Input
                      id={`${reference.id}-artist`}
                      value={reference.artist ?? ""}
                      onChange={(event) =>
                        updateExternalReference(reference.id, {
                          artist: event.target.value,
                        })
                      }
                      placeholder="Artist"
                    />
                  </div>
                </div>

                <div className="mt-2 space-y-1.5">
                  <Label htmlFor={`${reference.id}-url`}>Link</Label>
                  <Input
                    id={`${reference.id}-url`}
                    value={reference.url ?? ""}
                    onChange={(event) =>
                      updateExternalReference(reference.id, {
                        url: event.target.value,
                      })
                    }
                    placeholder="https://"
                  />
                </div>

                <div className="mt-2 space-y-1.5">
                  <Label htmlFor={`${reference.id}-notes`}>Style notes</Label>
                  <Textarea
                    id={`${reference.id}-notes`}
                    value={reference.notes ?? ""}
                    onChange={(event) =>
                      updateExternalReference(reference.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Mood, instruments, vocals, mix, tempo, texture..."
                    className="min-h-20 resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Suno style prompt</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {extraction.sourceCount} source
            {extraction.sourceCount === 1 ? "" : "s"}
          </Badge>
        </div>

        <Textarea
          value={extraction.prompt}
          readOnly
          placeholder="Select app versions or add external reference details."
          className="min-h-72 resize-none text-sm leading-relaxed"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={copyPrompt}
            disabled={!extraction.prompt}
            className="gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={applyPrompt}
            disabled={!extraction.prompt}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Apply to current version
          </Button>
        </div>

        {extraction.negativePrompt ? (
          <>
            <Separator className="my-4" />
            <div className="space-y-1.5">
              <Label htmlFor="style-extractor-negative">
                Suggested negative prompt
              </Label>
              <Textarea
                id="style-extractor-negative"
                value={extraction.negativePrompt}
                readOnly
                className="min-h-24 resize-none text-sm leading-relaxed"
              />
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
