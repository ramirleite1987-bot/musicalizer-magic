'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Track, TrackVersion, Theme } from '@/types/music'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { VersionsTab } from '@/components/VersionsTab'
import { PromptTab } from '@/components/PromptTab'
import { LyricsTab } from '@/components/LyricsTab'
import { StyleTab } from '@/components/StyleTab'
import { EvaluateTab } from '@/components/EvaluateTab'
import { ThemesTab } from '@/components/ThemesTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  initialTracks: Track[]
  initialThemes: Theme[]
  loadError?: string | null
}

export function MusicalizerApp({ initialTracks, initialThemes, loadError = null }: Props) {
  const router = useRouter()
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [themes, setThemes] = useState<Theme[]>(initialThemes)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    initialTracks[0]?.id ?? null
  )
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    initialTracks[0]?.versions[0]?.id ?? null
  )
  const [activeTab, setActiveTab] = useState('versions')

  const selectedTrack = tracks.find(t => t.id === selectedTrackId) ?? null
  const selectedVersion = selectedTrack?.versions.find(v => v.id === selectedVersionId) ?? null

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId)
    const track = tracks.find(t => t.id === trackId)
    setSelectedVersionId(track?.versions[0]?.id ?? null)
  }

  const handleSelectVersion = (versionId: string) => {
    setSelectedVersionId(versionId)
  }

  const handleUpdateVersion = async (updates: Partial<TrackVersion>) => {
    if (!selectedTrackId || !selectedVersionId) return
    setTracks(prev =>
      prev.map(t =>
        t.id === selectedTrackId
          ? {
              ...t,
              versions: t.versions.map(v =>
                v.id === selectedVersionId ? { ...v, ...updates } : v
              ),
            }
          : t
      )
    )
    try {
      await fetch(`/api/tracks/${selectedTrackId}/versions/${selectedVersionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      router.refresh()
    } catch {
      toast.error('Failed to save changes.')
    }
  }

  const handleMarkBest = async (versionId: string) => {
    if (!selectedTrackId) return
    setTracks(prev =>
      prev.map(t =>
        t.id === selectedTrackId
          ? {
              ...t,
              versions: t.versions.map(v => ({
                ...v,
                isBest: v.id === versionId,
              })),
            }
          : t
      )
    )
    try {
      await fetch(`/api/tracks/${selectedTrackId}/versions/${versionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBest: true }),
      })
      router.refresh()
    } catch {
      toast.error('Failed to mark best version.')
    }
  }

  const handleCloneVersion = async () => {
    if (!selectedTrackId || !selectedVersion) return
    try {
      const res = await fetch(`/api/tracks/${selectedTrackId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedVersion.prompt,
          negativePrompt: selectedVersion.negativePrompt,
          lyrics: selectedVersion.lyrics,
          style: selectedVersion.style,
          status: 'draft',
        }),
      })
      const newVersion: TrackVersion = await res.json()
      setTracks(prev =>
        prev.map(t =>
          t.id === selectedTrackId
            ? { ...t, versions: [...t.versions, newVersion] }
            : t
        )
      )
      setSelectedVersionId(newVersion.id)
      toast.success('Version cloned.')
      router.refresh()
    } catch {
      toast.error('Failed to clone version.')
    }
  }

  const handleCreateTrack = async (name: string, genre: string) => {
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, genre }),
      })
      const newTrack: Track = await res.json()
      setTracks(prev => [newTrack, ...prev])
      setSelectedTrackId(newTrack.id)
      setSelectedVersionId(newTrack.versions[0]?.id ?? null)
      toast.success('Track created.')
      router.refresh()
    } catch {
      toast.error('Failed to create track.')
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' })
      setTracks(prev => prev.filter(t => t.id !== trackId))
      if (selectedTrackId === trackId) {
        const remaining = tracks.filter(t => t.id !== trackId)
        setSelectedTrackId(remaining[0]?.id ?? null)
        setSelectedVersionId(remaining[0]?.versions[0]?.id ?? null)
      }
      toast.success('Track deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete track.')
    }
  }

  const handleAssignTheme = async (themeId: string) => {
    if (!selectedTrackId || !selectedTrack) return
    const newThemeIds = Array.from(new Set([...selectedTrack.themeIds, themeId]))
    setTracks(prev =>
      prev.map(t =>
        t.id === selectedTrackId ? { ...t, themeIds: newThemeIds } : t
      )
    )
    try {
      await fetch(`/api/tracks/${selectedTrackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeIds: newThemeIds }),
      })
      router.refresh()
    } catch {
      toast.error('Failed to assign theme.')
    }
  }

  const handleRemoveTheme = async (themeId: string) => {
    if (!selectedTrackId || !selectedTrack) return
    const newThemeIds = selectedTrack.themeIds.filter(id => id !== themeId)
    setTracks(prev =>
      prev.map(t =>
        t.id === selectedTrackId ? { ...t, themeIds: newThemeIds } : t
      )
    )
    try {
      await fetch(`/api/tracks/${selectedTrackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeIds: newThemeIds }),
      })
      router.refresh()
    } catch {
      toast.error('Failed to remove theme.')
    }
  }

  const handleCreateTheme = async (theme: Omit<Theme, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      const newTheme: Theme = await res.json()
      setThemes(prev => [...prev, newTheme])
      toast.success('Theme created.')
      router.refresh()
    } catch {
      toast.error('Failed to create theme.')
    }
  }

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await fetch(`/api/themes/${themeId}`, { method: 'DELETE' })
      setThemes(prev => prev.filter(t => t.id !== themeId))
      setTracks(prev =>
        prev.map(t => ({
          ...t,
          themeIds: t.themeIds.filter(id => id !== themeId),
        }))
      )
      toast.success('Theme deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete theme.')
    }
  }

  const handleAudioUpload = async (file: File) => {
    if (!selectedTrackId || !selectedVersionId) return
    const audioUrl = URL.createObjectURL(file)
    await handleUpdateVersion({ audioFileName: file.name, audioUrl })
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      <Sidebar
        tracks={tracks}
        themes={themes}
        selectedTrackId={selectedTrackId}
        onSelectTrack={handleSelectTrack}
        onCreateTrack={handleCreateTrack}
        onDeleteTrack={handleDeleteTrack}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          track={selectedTrack}
          version={selectedVersion}
          onUpdateVersion={handleUpdateVersion}
        />
        {loadError ? (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {loadError}
          </div>
        ) : null}
        {selectedTrack && selectedVersion ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/50 px-4">
              <TabsList className="h-10 bg-transparent p-0 gap-1">
                {['versions', 'prompt', 'lyrics', 'style', 'themes', 'evaluate'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex-1 overflow-auto">
              <TabsContent value="versions" className="h-full m-0">
                <VersionsTab
                  track={selectedTrack}
                  selectedVersionId={selectedVersionId}
                  onSelectVersion={handleSelectVersion}
                  onCloneVersion={handleCloneVersion}
                  onMarkBest={handleMarkBest}
                  onAudioUpload={handleAudioUpload}
                  version={selectedVersion}
                />
              </TabsContent>
              <TabsContent value="prompt" className="h-full m-0">
                <PromptTab version={selectedVersion} onUpdate={handleUpdateVersion} />
              </TabsContent>
              <TabsContent value="lyrics" className="h-full m-0">
                <LyricsTab version={selectedVersion} track={selectedTrack} onUpdate={handleUpdateVersion} />
              </TabsContent>
              <TabsContent value="style" className="h-full m-0">
                <StyleTab version={selectedVersion} onUpdate={handleUpdateVersion} />
              </TabsContent>
              <TabsContent value="themes" className="h-full m-0">
                <ThemesTab
                  track={selectedTrack}
                  themes={themes}
                  onAssignTheme={handleAssignTheme}
                  onRemoveTheme={handleRemoveTheme}
                  onCreateTheme={handleCreateTheme}
                  onDeleteTheme={handleDeleteTheme}
                />
              </TabsContent>
              <TabsContent value="evaluate" className="h-full m-0">
                <EvaluateTab
                  version={selectedVersion}
                  allVersions={selectedTrack.versions}
                  onUpdate={handleUpdateVersion}
                  onMarkBest={handleMarkBest}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a track to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
