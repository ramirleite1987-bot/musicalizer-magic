import React from 'react';
import { TrackVersion } from '../types/music';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'./ui/card';
import { Button } from './ui/button';
import { Mic2, Plus, Type } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
'./ui/accordion';
interface LyricsTabProps {
  version: TrackVersion;
  history: TrackVersion[];
  onChange: (updates: Partial<TrackVersion>) => void;
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

export function LyricsTab({ version, history, onChange }: LyricsTabProps) {
  const previousVersions = history.
  filter((v) => v.id !== version.id && v.lyrics).
  sort((a, b) => b.versionNumber - a.versionNumber);
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
      onChange({
        lyrics: newLyrics
      });
      // Focus back on textarea after a short delay to allow state update
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + tag.length + 1,
          start + tag.length + 1
        );
      }, 0);
    } else {
      onChange({
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
                onChange({
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

      {previousVersions.length > 0 &&
      <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-border/50">
            <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mic2 className="w-4 h-4" />
                <span>
                  Lyrics History ({previousVersions.length} previous versions)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 px-4 space-y-4">
              {previousVersions.map((prev) =>
            <div
              key={prev.id}
              className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
              
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Version {prev.versionNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(prev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-background/50 p-4 rounded border border-border/30 whitespace-pre-wrap font-mono leading-relaxed">
                    {prev.lyrics}
                  </div>
                </div>
            )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      }
    </div>);

}