"use client";

import { useState, useCallback, useTransition } from "react";
import { Track, TrackVersion, Theme } from "@/types/music";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { VersionsTab } from "@/components/versions-tab";
import { PromptTab } from "@/components/prompt-tab";
import { LyricsTab } from "@/components/lyrics-tab";
import { StyleTab } from "@/components/style-tab";
import { EvaluateTab } from "@/components/evaluate-tab";
import { ThemesTab } from "@/components/themes-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GitBranch,
  Sparkles,
  Mic2,
  Settings2,
  Activity,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateVersion as updateVersionAction,
  cloneVersion as cloneVersionAction,
  markBest as markBestAction,
} from "@/app/actions/versions";
import { startGeneration } from "@/app/actions/generation";
import {
  createTheme as createThemeAction,
  deleteTheme as deleteThemeAction,
  assignTheme as assignThemeAction,
  removeTheme as removeThemeAction,
} from "@/app/actions/themes";

interface DashboardClientProps {
  initialTracks: Track[];
  initialThemes: Theme[];
  loadWarning?: string | null;
}

export function DashboardClient({
  initialTracks,
  initialThemes,
  loadWarning = null,
}: DashboardClientProps) {
  const [tracks] = useState<Track[]>(initialTracks);
  const [themes] = useState<Theme[]>(initialThemes);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    initialTracks[0]?.id ?? null
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    () => {
      const firstTrack = initialTracks[0];
      if (!firstTrack) return null;
      const best = firstTrack.versions.find((v) => v.isBest);
      return best?.id ?? firstTrack.versions[0]?.id ?? null;
    }
  );
  const [activeTab, setActiveTab] = useState("versions");
  const [isPending, startTransition] = useTransition();

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;
  const selectedVersion =
    selectedTrack?.versions.find((v) => v.id === selectedVersionId) ?? null;
  const bestVersion =
    selectedTrack?.versions.find((v) => v.isBest) ?? null;

  const handleSelectTrack = useCallback(
    (id: string) => {
      setSelectedTrackId(id);
      const track = tracks.find((t) => t.id === id);
      if (track && track.versions.length > 0) {
        const best = track.versions.find((v) => v.isBest);
        setSelectedVersionId(
          best ? best.id : track.versions[track.versions.length - 1].id
        );
      } else {
        setSelectedVersionId(null);
      }
    },
    [tracks]
  );

  const handleUpdateVersion = useCallback(
    (updates: Partial<TrackVersion>) => {
      if (!selectedVersionId) return;
      startTransition(async () => {
        await updateVersionAction(selectedVersionId, updates);
      });
    },
    [selectedVersionId]
  );

  const handleNewVersion = useCallback(() => {
    if (!selectedVersionId) return;
    startTransition(async () => {
      const newVersion = await cloneVersionAction(selectedVersionId);
      if (newVersion) {
        setSelectedVersionId(newVersion.id);
        setActiveTab("prompt");
        toast.success(`Created Version ${newVersion.versionNumber}`, {
          description: "Copied settings from previous version.",
        });
      }
    });
  }, [selectedVersionId]);

  const handleMarkBest = useCallback(() => {
    if (!selectedTrackId || !selectedVersionId) return;
    startTransition(async () => {
      await markBestAction(selectedTrackId, selectedVersionId);
      toast.success("Marked as Best Version", {
        description:
          "This version will be used as the reference for future generations.",
      });
    });
  }, [selectedTrackId, selectedVersionId]);

  const handleGenerate = useCallback(() => {
    if (!selectedTrack || !selectedVersion || isPending) return;
    const versionId = selectedVersion.id;
    const provider = selectedVersion.style.provider ?? "suno";
    const modelLabel =
      provider === "minimax"
        ? `Minimax ${selectedVersion.style.minimaxModel || "music-1.5"}`
        : `Suno ${selectedVersion.style.sunoApiVersion}`;
    const toastId = toast.loading("Requesting generation…", {
      description: `${selectedTrack.name} v${selectedVersion.versionNumber} · ${modelLabel}`,
    });

    startGeneration(versionId)
      .then((result) => {
        if (!result.ok) {
          const description = result.issues?.length
            ? result.issues.map((i) => `${i.path}: ${i.message}`).join("\n")
            : result.error;
          toast.error("Cannot start generation", {
            id: toastId,
            description,
          });
          return;
        }

        toast.loading("Generating audio…", {
          id: toastId,
          description: "Polling for completion — this may take ~30s.",
        });

        const interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/generation/${versionId}/status`);
            const data = await res.json();
            if (data.status === "complete") {
              clearInterval(interval);
              toast.success("Audio ready!", {
                id: toastId,
                description: `${selectedTrack.name} v${selectedVersion.versionNumber}`,
              });
              window.location.reload();
            } else if (data.status === "failed") {
              clearInterval(interval);
              toast.error("Generation failed", {
                id: toastId,
                description: data.error ?? `Unknown error from ${result.provider}`,
              });
            }
          } catch {
            clearInterval(interval);
            toast.error("Polling error", { id: toastId });
          }
        }, 5000);
      })
      .catch((err: Error) => {
        toast.error("Could not start generation", {
          id: toastId,
          description: err.message,
        });
      });
  }, [selectedTrack, selectedVersion, isPending]);

  const handleUploadAudio = useCallback(
    async (file: File) => {
      if (!selectedVersionId) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const { url } = await res.json();
        startTransition(async () => {
          await updateVersionAction(selectedVersionId, {
            audioFileName: file.name,
            audioUrl: url,
            status: "complete",
          });
          toast.success("Audio uploaded", {
            description: file.name,
          });
        });
      } catch {
        toast.error("Upload failed");
      }
    },
    [selectedVersionId]
  );

  const handleRemoveAudio = useCallback(() => {
    if (!selectedVersionId) return;
    startTransition(async () => {
      await updateVersionAction(selectedVersionId, {
        audioFileName: null,
        audioUrl: null,
      });
    });
  }, [selectedVersionId]);

  const handleAssignTheme = useCallback(
    (themeId: string) => {
      if (!selectedTrackId) return;
      startTransition(async () => {
        await assignThemeAction(selectedTrackId, themeId);
      });
    },
    [selectedTrackId]
  );

  const handleRemoveTheme = useCallback(
    (themeId: string) => {
      if (!selectedTrackId) return;
      startTransition(async () => {
        await removeThemeAction(selectedTrackId, themeId);
      });
    },
    [selectedTrackId]
  );

  const handleCreateTheme = useCallback(
    (theme: Omit<Theme, "id" | "createdAt">) => {
      startTransition(async () => {
        await createThemeAction(theme);
        toast.success(`Theme "${theme.name}" created`);
      });
    },
    []
  );

  const handleDeleteTheme = useCallback(
    (themeId: string) => {
      startTransition(async () => {
        await deleteThemeAction(themeId);
      });
    },
    []
  );

  const handleGenerateThemes = useCallback(
    async (
      source: "url" | "document",
      content: string
    ): Promise<Omit<Theme, "id" | "createdAt">[]> => {
      try {
        const res = await fetch("/api/themes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, content }),
        });
        const data = await res.json();
        return data.themes ?? [];
      } catch {
        toast.error("Failed to generate themes");
        return [];
      }
    },
    []
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        tracks={tracks}
        themes={themes}
        selectedTrackId={selectedTrackId}
        onSelectTrack={handleSelectTrack}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-background/95">
        <Header
          track={selectedTrack}
          version={selectedVersion}
          onGenerate={handleGenerate}
        />

        {loadWarning ? (
          <div
            role="alert"
            className="mx-6 mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          >
            {loadWarning}
          </div>
        ) : null}

        {selectedTrack && selectedVersion ? (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 pt-4 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <TabsList className="bg-muted/50 border border-border/50 p-1">
                  <TabsTrigger
                    value="versions"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <GitBranch className="w-4 h-4" />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger
                    value="prompt"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger
                    value="lyrics"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Mic2 className="w-4 h-4" />
                    Lyrics
                  </TabsTrigger>
                  <TabsTrigger
                    value="style"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Settings2 className="w-4 h-4" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger
                    value="themes"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Palette className="w-4 h-4" />
                    Themes
                  </TabsTrigger>
                  <TabsTrigger
                    value="evaluate"
                    className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Activity className="w-4 h-4" />
                    Evaluate
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="h-full">
                  <TabsContent
                    value="versions"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <VersionsTab
                      versions={selectedTrack.versions}
                      selectedVersionId={selectedVersionId}
                      onSelectVersion={setSelectedVersionId}
                      onNewVersion={handleNewVersion}
                      onUploadAudio={handleUploadAudio}
                      onRemoveAudio={handleRemoveAudio}
                    />
                  </TabsContent>

                  <TabsContent
                    value="prompt"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <PromptTab
                      version={selectedVersion}
                      history={selectedTrack.versions}
                      onChange={handleUpdateVersion}
                    />
                  </TabsContent>

                  <TabsContent
                    value="lyrics"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <LyricsTab
                      version={selectedVersion}
                      history={selectedTrack.versions}
                      onChange={handleUpdateVersion}
                    />
                  </TabsContent>

                  <TabsContent
                    value="style"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <StyleTab
                      version={selectedVersion}
                      onChange={handleUpdateVersion}
                    />
                  </TabsContent>

                  <TabsContent
                    value="themes"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <ThemesTab
                      track={selectedTrack}
                      themes={themes}
                      onAssignTheme={handleAssignTheme}
                      onRemoveTheme={handleRemoveTheme}
                      onCreateTheme={handleCreateTheme}
                      onDeleteTheme={handleDeleteTheme}
                      onGenerateThemes={handleGenerateThemes}
                    />
                  </TabsContent>

                  <TabsContent
                    value="evaluate"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    <EvaluateTab
                      version={selectedVersion}
                      bestVersion={bestVersion}
                      onChange={handleUpdateVersion}
                      onMarkBest={handleMarkBest}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <Mic2 className="w-12 h-12 mx-auto opacity-20" />
              <p>Select a track from the sidebar to view its details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
