'use client'

import React from 'react';
import type { Track, TrackVersion } from '@/types/music';
import { Textarea } from './ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'./ui/card';
import { Button } from './ui/button';
import { Mic2, Plus, Type } from 'lucide-react';

interface LyricsTabProps {
  version: TrackVersion;
  track: Track;
  onUpdate: (updates: Partial<TrackVersion>) => Promise<void>;
}

const STRUCTURE_TAGS = [
'[Intro]',
'[Verse 1]',
'[Verse 2]',
'[Pre-Chorus]',
'[Chorus]',
'[Bridge]',
'[Guitar Solo]',
'[Outro]'];

export function LyricsTab({ version, onUpdate }: LyricsTabProps) {
  const wordCount = version.lyrics.
  trim().
  split(/\s+/).
  filter((w) => w.length > 0).length;
  const lineCount = version.lyrics.
  split('\n').
  filter((l) => l.trim().length > 0).length;

  const insertTag = (tag: string) => {
    const textarea = document.getElementById('lyrics') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newLyrics =
      version.lyrics.substring(0, start) +
      tag +
      '\n' +
      version.lyrics.substring(end);
      onUpdate({
        lyrics: newLyrics
      });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + tag.length + 1,
          start + tag.length + 1
        );
      }, 0);
    } else {
      onUpdate({
        lyrics: version.lyrics + (version.lyrics ? '\n' : '') + tag + '\n'
      });
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-primary" />
            Lyrics Editor
          </h2>
          <p className="text-muted-foreground text-sm">
            Write and structure the lyrics for your track.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-border/50">
          <div className="flex items-center gap-1.5">
            <Type className="w-4 h-4" />
            <span className="font-medium text-foreground">
              {wordCount}
            </span>{' '}
            words
          </div>
          <div className="w-px h-4 bg-border/50" />
          <div>
            <span className="font-medium text-foreground">{lineCount}</span>{' '}
            lines
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardContent className="p-0">
              <Textarea
                id="lyrics"
                value={version.lyrics}
                onChange={(e) =>
                onUpdate({
                  lyrics: e.target.value
                })
                }
                placeholder="Enter your lyrics here. Use structure tags like [Verse 1] or [Chorus] to guide the AI..."
                className="min-h-[500px] resize-y bg-transparent border-0 focus-visible:ring-0 text-base leading-loose p-6 font-mono" />

            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Structure Tags
              </CardTitle>
              <CardDescription className="text-xs">
                Click to insert at cursor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {STRUCTURE_TAGS.map((tag) =>
              <Button
                key={tag}
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs font-mono h-8 bg-background/50 hover:bg-primary/10 hover:text-primary border-border/50"
                onClick={() => insertTag(tag)}>

                  <Plus className="w-3 h-3 mr-2 opacity-50" />
                  {tag}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
