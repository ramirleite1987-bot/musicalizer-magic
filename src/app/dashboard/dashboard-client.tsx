"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
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
  startBatchGeneration,
} from "@/app/actions/versions";
import { updateTrack as updateTrackAction } from "@/app/actions/tracks";
import { startGeneration } from "@/app/actions/generation";
import { createShareLink } from "@/app/actions/share";
import {
  createTheme as createThemeAction,
  deleteTheme as deleteThemeAction,
  assignTheme as assignThemeAction,
  removeTheme as removeThemeAction,
} from "@/app/actions/themes";
import {
  useKeyboardShortcuts,
  KeyboardShortcutsHelp,
} from "@/components/keyboard-shortcuts";
import { GenerationProgressCard } from "@/components/generation-progress-card";
import { SearchPalette } from "@/components/search-palette";
import { OnboardingEmptyState } from "@/components/onboarding-empty-state";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { CreateTrackDialog } from "@/components/create-track-dialog";
import { ActivityPanel } from "@/components/activity-panel";
import { CatholicStudioDialog } from "@/components/catholic-studio-dialog";
import { CoProducerChat } from "@/components/co-producer-chat";
import { useI18n } from "@/i18n/provider";

// Tab names ordered to match shortcut keys 1-6
const TAB_NAMES = ["versions", "prompt", "lyrics", "style", "themes", "evaluate"] as const;

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
  const { t } = useI18n();
  const [tracks] = useState<Track[]>(initialTracks);
  const [themes] = useState<Theme[]>(initialThemes);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(() => {
    // If a ?track=<id> query param is present, select that track
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get("track");
      if (trackParam && initialTracks.some((t) => t.id === trackParam)) {
        return trackParam;
      }
    }
    return initialTracks[0]?.id ?? null;
  });
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    () => {
      // Resolve initial track (may be from query param)
      let firstTrack: Track | undefined;
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const trackParam = params.get("track");
        if (trackParam) {
          firstTrack = initialTracks.find((t) => t.id === trackParam);
        }
      }
      if (!firstTrack) firstTrack = initialTracks[0];
      if (!firstTrack) return null;
      const best = firstTrack.versions.find((v) => v.isBest);
      return best?.id ?? firstTrack.versions[0]?.id ?? null;
    }
  );
  const [activeTab, setActiveTab] = useState("versions");
  const [showHelp, setShowHelp] = useState(false);
  const [showSearchPalette, setShowSearchPalette] = useState(false);
  const [showCreateTrack, setShowCreateTrack] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showCatholic, setShowCatholic] = useState(false);
  const [showCoProducer, setShowCoProducer] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Active generation progress cards — supports multiple concurrent cards (batch)
  const [activeGenerations, setActiveGenerations] = useState<
    Array<{
      versionId: string;
      provider: string;
      model: string;
      versionLabel: string;
    }>
  >([]);

  // isBatchGenerating tracks whether batch generation is being set up
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

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
        toast.success(t("toasts.versionCreated", { n: newVersion.versionNumber }), {
          description: t("toasts.versionCreatedDesc"),
        });
      }
    });
  }, [selectedVersionId, t]);

  const handleMarkBest = useCallback(() => {
    if (!selectedTrackId || !selectedVersionId) return;
    startTransition(async () => {
      await markBestAction(selectedTrackId, selectedVersionId);
      toast.success(t("toasts.markedBest"), {
        description: t("toasts.markedBestDesc"),
      });
    });
  }, [selectedTrackId, selectedVersionId, t]);

  const handleMarkBestVersion = useCallback(
    (versionId: string) => {
      if (!selectedTrackId) return;
      startTransition(async () => {
        await markBestAction(selectedTrackId, versionId);
        toast.success(t("toasts.markedBest"), {
          description: t("toasts.markedBestDesc"),
        });
      });
    },
    [selectedTrackId, t]
  );

  const handleRenameTrack = useCallback(
    (newName: string) => {
      if (!selectedTrackId) return;
      startTransition(async () => {
        await updateTrackAction(selectedTrackId, { name: newName });
        toast.success(t("toasts.trackRenamed"), { description: newName });
        window.location.reload();
      });
    },
    [selectedTrackId, t]
  );

  const handleGenerate = useCallback(() => {
    if (!selectedTrack || !selectedVersion || isPending) return;
    const versionId = selectedVersion.id;
    const provider = selectedVersion.style.provider ?? "suno";
    const modelLabel =
      provider === "minimax"
        ? `${selectedVersion.style.minimaxModel || "music-1.5"}`
        : `${selectedVersion.style.sunoApiVersion}`;
    const versionLabel = `${selectedTrack.name} v${selectedVersion.versionNumber}`;

    startGeneration(versionId)
      .then(() => {
        // Switch to versions tab so the progress card is visible
        setActiveTab("versions");
        setActiveGenerations((prev) => [
          ...prev,
          {
            versionId,
            provider,
            model: modelLabel,
            versionLabel,
          },
        ]);
      })
      .catch((err: Error) => {
        toast.error(t("toasts.couldNotStartGeneration"), {
          description: err.message,
        });
      });
  }, [selectedTrack, selectedVersion, isPending, t]);

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
          toast.success(t("toasts.audioUploaded"), {
            description: file.name,
          });
        });
      } catch {
        toast.error(t("toasts.uploadFailed"));
      }
    },
    [selectedVersionId, t]
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

  const handleGenerationComplete = useCallback(() => {
    // Reload so the Server Component re-fetches updated version data
    window.location.reload();
  }, []);

  const handleGenerationDismiss = useCallback((versionId: string) => {
    setActiveGenerations((prev) => prev.filter((g) => g.versionId !== versionId));
  }, []);

  const handleBatchGenerate = useCallback(() => {
    if (!selectedTrack || !selectedVersion || isBatchGenerating) return;
    setIsBatchGenerating(true);
    startBatchGeneration(selectedTrack.id, selectedVersion.id)
      .then((results) => {
        setActiveTab("versions");
        setActiveGenerations((prev) => [
          ...prev,
          ...results.map((r) => ({
            versionId: r.versionId,
            provider: r.provider,
            model: r.model,
            versionLabel: `${selectedTrack.name} v${r.versionNumber}`,
          })),
        ]);
        toast.success(t("toasts.batchStarted"), {
          description: t("toasts.batchStartedDesc"),
        });
      })
      .catch((err: Error) => {
        toast.error(t("toasts.batchFailed"), {
          description: err.message,
        });
      })
      .finally(() => {
        setIsBatchGenerating(false);
      });
  }, [selectedTrack, selectedVersion, isBatchGenerating, t]);

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
        toast.success(t("toasts.themeCreated", { name: theme.name }));
      });
    },
    [t]
  );

  const handleDeleteTheme = useCallback(
    (themeId: string) => {
      startTransition(async () => {
        await deleteThemeAction(themeId);
      });
    },
    []
  );

  const handleShare = useCallback(async () => {
    if (!selectedTrack || !selectedVersion) return;
    try {
      const url = await createShareLink(
        selectedTrack.id,
        selectedVersion.id,
        selectedTrack.name,
        selectedVersion
      );
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied!", {
        description: url,
      });
    } catch (err) {
      toast.error("Failed to create share link", {
        description: err instanceof Error ? err.message : "Unknown error.",
      });
    }
  }, [selectedTrack, selectedVersion]);

  // -----------------------------------------------------------------------
  // Keyboard shortcut handlers
  // -----------------------------------------------------------------------

  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrackId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tracks.length;
    handleSelectTrack(tracks[nextIndex].id);
  }, [tracks, selectedTrackId, handleSelectTrack]);

  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === selectedTrackId);
    const prevIndex =
      currentIndex === -1
        ? tracks.length - 1
        : (currentIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIndex].id);
  }, [tracks, selectedTrackId, handleSelectTrack]);

  const handleSwitchTab = useCallback((index: number) => {
    const name = TAB_NAMES[index];
    if (name) setActiveTab(name);
  }, []);

  const handleCloneVersion = useCallback(() => {
    // Clone behaves the same as new version (cloneVersionAction copies current)
    handleNewVersion();
  }, [handleNewVersion]);

  const handleToggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  useKeyboardShortcuts({
    onNextTrack: handleNextTrack,
    onPrevTrack: handlePrevTrack,
    onSwitchTab: handleSwitchTab,
    onGenerate: handleGenerate,
    onNewVersion: handleNewVersion,
    onCloneVersion: handleCloneVersion,
    onToggleHelp: handleToggleHelp,
  });

  // Cmd+K / Ctrl+K shortcut to open search palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchPalette((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSearchResult = useCallback(
    (trackId: string, versionId?: string) => {
      setSelectedTrackId(trackId);
      if (versionId) {
        setSelectedVersionId(versionId);
      } else {
        const track = tracks.find((t) => t.id === trackId);
        if (track && track.versions.length > 0) {
          const best = track.versions.find((v) => v.isBest);
          setSelectedVersionId(best ? best.id : track.versions[track.versions.length - 1].id);
        } else {
          setSelectedVersionId(null);
        }
      }
    },
    [tracks]
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
        toast.error(t("toasts.themeGenFailed"));
        return [];
      }
    },
    [t]
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        tracks={tracks}
        themes={themes}
        selectedTrackId={selectedTrackId}
        onSelectTrack={(id) => {
          handleSelectTrack(id);
          setMobileSidebarOpen(false);
        }}
        onTrackDuplicated={(newTrackId) => {
          // Reload page and navigate to the duplicated track
          window.location.href = `/dashboard?track=${newTrackId}`;
        }}
        onTrackDeleted={(deletedTrackId) => {
          // If the deleted track was selected, reload to pick a new one
          if (deletedTrackId === selectedTrackId) {
            window.location.reload();
          } else {
            window.location.reload();
          }
        }}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-background/95">
        <Header
          track={selectedTrack}
          version={selectedVersion}
          onGenerate={handleGenerate}
          onBatchGenerate={handleBatchGenerate}
          isBatchGenerating={isBatchGenerating}
          themes={themes}
          onImported={(newTrackId) => {
            // Reload the page so the server component re-fetches the new track
            window.location.href = `/dashboard?track=${newTrackId}`;
          }}
          onRenameTrack={handleRenameTrack}
          onOpenSearch={() => setShowSearchPalette(true)}
          onOpenActivity={() => setShowActivity((prev) => !prev)}
          onOpenCatholic={() => setShowCatholic(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onShare={handleShare}
          onOpenCoProducer={selectedTrack && selectedVersion ? () => setShowCoProducer((prev) => !prev) : undefined}
        />

        {loadWarning ? (
          <div
            role="alert"
            className="mx-6 mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
          >
            {loadWarning}
          </div>
        ) : null}

        {tracks.length > 0 && <OnboardingBanner />}

        {selectedTrack && selectedVersion ? (
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <div className="px-3 sm:px-6 pt-4 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <TabsList className="bg-muted/50 border border-border/50 p-1 overflow-x-auto flex w-full sm:w-auto">
                  <TabsTrigger
                    value="versions"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Versions"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.versions")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="prompt"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Prompt"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.prompt")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="lyrics"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Lyrics"
                  >
                    <Mic2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.lyrics")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="style"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Style"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.style")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="themes"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Themes"
                  >
                    <Palette className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.themes")}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="evaluate"
                    className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm flex-shrink-0"
                    title="Evaluate"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("tabs.evaluate")}</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="h-full">
                  <TabsContent
                    value="versions"
                    className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300"
                  >
                    {activeGenerations.length > 0 && (
                      <div className="px-4 pt-4 flex flex-col gap-3">
                        {activeGenerations.map((gen) => (
                          <GenerationProgressCard
                            key={gen.versionId}
                            versionId={gen.versionId}
                            provider={gen.provider}
                            model={gen.model}
                            versionLabel={gen.versionLabel}
                            onComplete={handleGenerationComplete}
                            onDismiss={() => handleGenerationDismiss(gen.versionId)}
                          />
                        ))}
                      </div>
                    )}
                    <VersionsTab
                      versions={selectedTrack.versions}
                      selectedVersionId={selectedVersionId}
                      onSelectVersion={setSelectedVersionId}
                      onNewVersion={handleNewVersion}
                      onUploadAudio={handleUploadAudio}
                      onRemoveAudio={handleRemoveAudio}
                      onMarkBest={handleMarkBestVersion}
                      trackName={selectedTrack.name}
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
                      onSelectVersion={setSelectedVersionId}
                      onStyleChange={(styleUpdates) =>
                        handleUpdateVersion({
                          style: {
                            ...selectedVersion.style,
                            ...styleUpdates,
                          },
                        })
                      }
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
                      trackName={selectedTrack.name}
                      trackStyle={selectedVersion.style}
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
                      trackName={selectedTrack?.name ?? ""}
                      onChange={handleUpdateVersion}
                      onMarkBest={handleMarkBest}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        ) : tracks.length === 0 ? (
          <OnboardingEmptyState onCreateTrack={() => setShowCreateTrack(true)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <Mic2 className="w-12 h-12 mx-auto opacity-20" />
              <p>{t("dashboard.selectTrackDetails")}</p>
            </div>
          </div>
        )}
      </div>

      <KeyboardShortcutsHelp open={showHelp} onClose={handleCloseHelp} />

      <SearchPalette
        tracks={tracks}
        open={showSearchPalette}
        onClose={() => setShowSearchPalette(false)}
        onSelectResult={handleSearchResult}
      />

      <CreateTrackDialog
        open={showCreateTrack}
        onOpenChange={setShowCreateTrack}
        onCreated={() => window.location.reload()}
      />

      <CatholicStudioDialog
        open={showCatholic}
        onOpenChange={setShowCatholic}
        onCreated={(trackId) => {
          window.location.href = `/dashboard?track=${trackId}`;
        }}
      />

      {showActivity && (
        <ActivityPanel
          tracks={tracks}
          themes={themes}
          onSelectTrack={handleSelectTrack}
          onClose={() => setShowActivity(false)}
        />
      )}

      {showCoProducer && selectedTrack && selectedVersion && (
        <CoProducerChat
          track={selectedTrack}
          version={selectedVersion}
          onClose={() => setShowCoProducer(false)}
          onApplyPrompt={(content) =>
            handleUpdateVersion({ prompt: content })
          }
          onApplyLyrics={(content) =>
            handleUpdateVersion({ lyrics: content })
          }
        />
      )}
    </div>
  );
}
