import React, { useEffect, useState } from 'react';
import { MOCK_TRACKS, MOCK_THEMES } from './data/mockData';
import { Track, TrackVersion, Theme } from './types/music';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { VersionsTab } from './components/VersionsTab';
import { PromptTab } from './components/PromptTab';
import { LyricsTab } from './components/LyricsTab';
import { StyleTab } from './components/StyleTab';
import { EvaluateTab } from './components/EvaluateTab';
import { ThemesTab } from './components/ThemesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { ScrollArea } from './components/ui/scroll-area';
import {
  GitBranch,
  Sparkles,
  Mic2,
  Settings2,
  Activity,
  Palette } from
'lucide-react';
export function App() {
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [themes, setThemes] = useState<Theme[]>(MOCK_THEMES);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    MOCK_TRACKS[0].id
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    MOCK_TRACKS[0].versions[0].id
  );
  const [activeTab, setActiveTab] = useState('versions');
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || null;
  const selectedVersion =
  selectedTrack?.versions.find((v) => v.id === selectedVersionId) || null;
  const bestVersion = selectedTrack?.versions.find((v) => v.isBest) || null;
  // Ensure dark mode is active
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  const handleSelectTrack = (id: string) => {
    setSelectedTrackId(id);
    const track = tracks.find((t) => t.id === id);
    if (track && track.versions.length > 0) {
      // Select the best version by default, or the latest
      const best = track.versions.find((v) => v.isBest);
      setSelectedVersionId(
        best ? best.id : track.versions[track.versions.length - 1].id
      );
    } else {
      setSelectedVersionId(null);
    }
  };
  const handleUpdateVersion = (updates: Partial<TrackVersion>) => {
    if (!selectedTrackId || !selectedVersionId) return;
    setTracks((prev) =>
    prev.map((track) => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        versions: track.versions.map((v) =>
        v.id === selectedVersionId ?
        {
          ...v,
          ...updates
        } :
        v
        )
      };
    })
    );
  };
  const handleNewVersion = () => {
    if (!selectedTrack || !selectedVersion) return;
    const newVersionNumber =
    Math.max(...selectedTrack.versions.map((v) => v.versionNumber)) + 1;
    const newVersion: TrackVersion = {
      ...selectedVersion,
      id: `v${selectedTrack.id}-${Date.now()}`,
      versionNumber: newVersionNumber,
      createdAt: new Date().toISOString(),
      status: 'draft',
      rating: 0,
      dimensionScores: {
        melody: 0,
        harmony: 0,
        rhythm: 0,
        production: 0,
        lyricsFit: 0,
        originality: 0,
        emotionalImpact: 0
      },
      notes: '',
      feedback: {
        musicPositives: '',
        musicNegatives: '',
        lyricsPositives: '',
        lyricsNegatives: '',
        thingsToAvoid: ''
      },
      isBest: false,
      audioFileName: null,
      audioUrl: null
    };
    setTracks((prev) =>
    prev.map((track) => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        versions: [...track.versions, newVersion]
      };
    })
    );
    setSelectedVersionId(newVersion.id);
    setActiveTab('prompt');
    toast.success(`Created Version ${newVersionNumber}`, {
      description: 'Copied settings from previous version.'
    });
  };
  const handleMarkBest = () => {
    if (!selectedTrackId || !selectedVersionId) return;
    setTracks((prev) =>
    prev.map((track) => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        versions: track.versions.map((v) => ({
          ...v,
          isBest: v.id === selectedVersionId
        }))
      };
    })
    );
    toast.success('Marked as Best Version', {
      description:
      'This version will be used as the reference for future generations.'
    });
  };
  const handleAssignTheme = (themeId: string) => {
    if (!selectedTrackId) return;
    setTracks((prev) =>
    prev.map((track) => {
      if (track.id !== selectedTrackId) return track;
      if (track.themeIds.includes(themeId)) return track;
      return {
        ...track,
        themeIds: [...track.themeIds, themeId]
      };
    })
    );
  };
  const handleRemoveTheme = (themeId: string) => {
    if (!selectedTrackId) return;
    setTracks((prev) =>
    prev.map((track) => {
      if (track.id !== selectedTrackId) return track;
      return {
        ...track,
        themeIds: track.themeIds.filter((id) => id !== themeId)
      };
    })
    );
  };
  const handleCreateTheme = (theme: Omit<Theme, 'id' | 'createdAt'>) => {
    const newTheme: Theme = {
      ...theme,
      id: `th-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setThemes((prev) => [...prev, newTheme]);
  };
  const handleDeleteTheme = (themeId: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== themeId));
    setTracks((prev) =>
    prev.map((track) => ({
      ...track,
      themeIds: track.themeIds.filter((id) => id !== themeId)
    }))
    );
  };
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        tracks={tracks}
        themes={themes}
        selectedTrackId={selectedTrackId}
        onSelectTrack={handleSelectTrack} />
      

      <div className="flex-1 flex flex-col min-w-0 bg-background/95">
        <Header track={selectedTrack} version={selectedVersion} />

        {selectedTrack && selectedVersion ?
        <div className="flex-1 flex flex-col min-h-0">
            <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col">
            
              <div className="px-6 pt-4 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <TabsList className="bg-muted/50 border border-border/50 p-1">
                  <TabsTrigger
                  value="versions"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <GitBranch className="w-4 h-4" />
                    Versions
                  </TabsTrigger>
                  <TabsTrigger
                  value="prompt"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <Sparkles className="w-4 h-4" />
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger
                  value="lyrics"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <Mic2 className="w-4 h-4" />
                    Lyrics
                  </TabsTrigger>
                  <TabsTrigger
                  value="style"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <Settings2 className="w-4 h-4" />
                    Style
                  </TabsTrigger>
                  <TabsTrigger
                  value="themes"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <Palette className="w-4 h-4" />
                    Themes
                  </TabsTrigger>
                  <TabsTrigger
                  value="evaluate"
                  className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  
                    <Activity className="w-4 h-4" />
                    Evaluate
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="h-full">
                  <TabsContent
                  value="versions"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <VersionsTab
                    versions={selectedTrack.versions}
                    selectedVersionId={selectedVersionId}
                    onSelectVersion={setSelectedVersionId}
                    onNewVersion={handleNewVersion}
                    onUpdateVersion={handleUpdateVersion} />
                  
                  </TabsContent>

                  <TabsContent
                  value="prompt"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <PromptTab
                    version={selectedVersion}
                    history={selectedTrack.versions}
                    onChange={handleUpdateVersion} />
                  
                  </TabsContent>

                  <TabsContent
                  value="lyrics"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <LyricsTab
                    version={selectedVersion}
                    history={selectedTrack.versions}
                    onChange={handleUpdateVersion} />
                  
                  </TabsContent>

                  <TabsContent
                  value="style"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <StyleTab
                    version={selectedVersion}
                    onChange={handleUpdateVersion} />
                  
                  </TabsContent>

                  <TabsContent
                  value="themes"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <ThemesTab
                    track={selectedTrack}
                    themes={themes}
                    onAssignTheme={handleAssignTheme}
                    onRemoveTheme={handleRemoveTheme}
                    onCreateTheme={handleCreateTheme}
                    onDeleteTheme={handleDeleteTheme} />
                  
                  </TabsContent>

                  <TabsContent
                  value="evaluate"
                  className="m-0 h-full data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 duration-300">
                  
                    <EvaluateTab
                    version={selectedVersion}
                    bestVersion={bestVersion}
                    onChange={handleUpdateVersion}
                    onMarkBest={handleMarkBest} />
                  
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div> :

        <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <Mic2 className="w-12 h-12 mx-auto opacity-20" />
              <p>Select a track from the sidebar to view its details.</p>
            </div>
          </div>
        }
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>);

}