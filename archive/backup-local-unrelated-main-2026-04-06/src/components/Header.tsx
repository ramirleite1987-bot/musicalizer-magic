'use client'

import React from 'react';
import { Sparkles, Settings, ChevronRight, Cpu } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Track, TrackVersion } from '@/types/music';
import { toast } from 'sonner';

interface HeaderProps {
  track: Track | null;
  version: TrackVersion | null;
  onUpdateVersion: (updates: Partial<TrackVersion>) => Promise<void>;
}

export function Header({ track, version }: HeaderProps) {
  const handleGenerate = () => {
    toast('Generation Started', {
      description: `Generating new audio for ${track?.name} (v${version?.versionNumber}) using Suno ${version?.style.sunoApiVersion}...`,
      icon: <Sparkles className="w-4 h-4 text-primary" />
    });
  };
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm">
        {track ?
        <>
            <span className="font-medium text-foreground">{track.name}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Version {version?.versionNumber || '?'}
            </span>
            {version?.style.sunoApiVersion &&
          <Badge
            variant="outline"
            className="ml-1 text-[10px] px-1.5 py-0 h-5 font-mono bg-blue-500/10 text-blue-400 border-blue-500/20">

                <Cpu className="w-3 h-3 mr-1" />
                Suno {version.style.sunoApiVersion}
              </Badge>
          }
            {version?.status === 'draft' &&
          <Badge
            variant="outline"
            className="ml-2 text-xs font-normal border-dashed">

                Draft
              </Badge>
          }
            {version?.status === 'generating' &&
          <Badge
            variant="secondary"
            className="ml-2 text-xs font-normal bg-blue-500/10 text-blue-500">

                Generating...
              </Badge>
          }
          </> :

        <span className="text-muted-foreground">Select a track to begin</span>
        }
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button
          size="sm"
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          onClick={handleGenerate}
          disabled={!track || !version || version.status === 'generating'}>

          <Sparkles className="w-4 h-4" />
          Generate Audio
        </Button>
      </div>
    </header>);
}
