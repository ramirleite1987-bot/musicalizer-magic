'use client'

import React, { useState } from 'react';
import { Search, Music, Star, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { Track, Theme } from '@/types/music';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'./ui/select';

interface SidebarProps {
  tracks: Track[];
  themes: Theme[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onCreateTrack: (name: string, genre: string) => Promise<void>;
  onDeleteTrack: (trackId: string) => Promise<void>;
}

const COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  orange: 'bg-orange-500'
};

export function Sidebar({
  tracks,
  themes,
  selectedTrackId,
  onSelectTrack,
}: SidebarProps) {
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const filteredTracks =
  themeFilter === 'all' ?
  tracks :
  tracks.filter((t) => t.themeIds.includes(themeFilter));
  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <div className="bg-primary/20 p-2 rounded-md">
          <Music className="w-5 h-5 text-primary" />
        </div>
        <h1 className="font-heading font-semibold text-lg tracking-tight">
          SoundForge AI
        </h1>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks..."
            className="pl-8 bg-background/50 border-border/50 focus-visible:ring-1 h-9" />

        </div>
        <Select value={themeFilter} onValueChange={setThemeFilter}>
          <SelectTrigger className="w-full h-8 text-xs bg-background/50 border-border/50">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <SelectValue placeholder="Filter by Theme" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map((t) =>
            <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <div
                  className={`w-2 h-2 rounded-full ${COLOR_MAP[t.color]}`} />

                  {t.name}
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredTracks.map((track) => {
          const isSelected = track.id === selectedTrackId;
          const bestVersion = track.versions.find((v) => v.isBest);
          const trackThemes = themes.filter((t) =>
          track.themeIds.includes(t.id)
          );
          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-2 ${isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'}`}>

              <div className="flex justify-between items-start w-full">
                <span className="font-medium truncate pr-2">{track.name}</span>
                {bestVersion &&
                <div className="flex items-center text-yellow-500 shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs ml-1">{bestVersion.rating}</span>
                  </div>
                }
              </div>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-normal">

                    {track.genre}
                  </Badge>
                  {trackThemes.length > 0 &&
                  <div className="flex -space-x-1">
                      {trackThemes.slice(0, 2).map((t) =>
                    <div
                      key={t.id}
                      className={`w-2.5 h-2.5 rounded-full border border-background ${COLOR_MAP[t.color]}`} />

                    )}
                      {trackThemes.length > 2 &&
                    <div className="w-2.5 h-2.5 rounded-full border border-background bg-muted flex items-center justify-center text-[6px] font-bold">
                          +
                        </div>
                    }
                    </div>
                  }
                </div>
                <span className="text-xs opacity-70">
                  {track.versions.length} ver
                  {track.versions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>);

        })}
      </div>
    </div>);
}
