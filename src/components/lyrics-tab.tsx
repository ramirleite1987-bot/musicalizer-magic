"use client";

import { useState, useMemo } from "react";
import { History, AlignLeft, Hash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { TrackVersion } from "@/types/music";

// Common Suno structure tags
const STRUCTURE_TAGS = [
  { label: "[Verse]", tag: "[Verse]" },
  { label: "[Pre-Chorus]", tag: "[Pre-Chorus]" },
  { label: "[Chorus]", tag: "[Chorus]" },
  { label: "[Bridge]", tag: "[Bridge]" },
  { label: "[Outro]", tag: "[Outro]" },
  { label: "[Intro]", tag: "[Intro]" },
  { label: "[Hook]", tag: "[Hook]" },
  { label: "[Break]", tag: "[Break]" },
  { label: "[Instrumental]", tag: "[Instrumental]" },
  { label: "[Solo]", tag: "[Solo]" },
  { label: "[Ad-lib]", tag: "[Ad-lib]" },
  { label: "[Spoken]", tag: "[Spoken]" },
];

interface LyricsTabProps {
  version: TrackVersion;
  history: TrackVersion[];
  onChange: (updates: Partial<TrackVersion>) => void;
}

export function LyricsTab({ version, history, onChange }: LyricsTabProps) {
  const [lyrics, setLyrics] = useState(version.lyrics);

  const handleLyricsChange = (value: string) => {
    setLyrics(value);
    onChange({ lyrics: value });
  };

  const insertTag = (tag: string) => {
    handleLyricsChange(lyrics ? `${lyrics}\n${tag}\n` : `${tag}\n`);
  };

  const applyFromHistory = (historyVersion: TrackVersion) => {
    setLyrics(historyVersion.lyrics);
    onChange({ lyrics: historyVersion.lyrics });
  };

  const { wordCount, lineCount } = useMemo(() => {
    const lines = lyrics.split("\n").filter((l) => l.trim().length > 0);
    const words = lyrics
      .replace(/\[.*?\]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return { wordCount: words.length, lineCount: lines.length };
  }, [lyrics]);

  const pastVersions = history.filter((v) => v.id !== version.id && v.lyrics);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Hash className="w-3.5 h-3.5" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <AlignLeft className="w-3.5 h-3.5" />
          <span>{lineCount} lines</span>
        </div>
      </div>

      {/* Structure tags sidebar */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Insert Structure Tag
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {STRUCTURE_TAGS.map(({ label, tag }) => (
            <button
              key={tag}
              onClick={() => insertTag(tag)}
              className="px-2.5 py-1 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors font-mono"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Lyrics textarea */}
      <div className="space-y-2">
        <Label htmlFor="lyrics" className="text-sm font-medium">
          Lyrics
        </Label>
        <Textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => handleLyricsChange(e.target.value)}
          placeholder="Write your lyrics here. Use structure tags like [Verse], [Chorus], [Bridge] to organize sections..."
          className="min-h-[320px] resize-none text-sm leading-relaxed font-mono"
        />
        <p className="text-xs text-zinc-400">
          Use Suno structure tags in brackets to guide song structure. Leave empty to let Suno generate lyrics.
        </p>
      </div>

      {/* Lyrics history */}
      {pastVersions.length > 0 && (
        <Accordion>
          <AccordionItem value="lyrics-history" className="border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                Lyrics History
                <Badge variant="secondary" className="text-xs ml-1">
                  {pastVersions.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-64">
                <div className="px-4 pb-4 space-y-3">
                  {pastVersions.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          v{v.versionNumber}
                        </span>
                        <button
                          onClick={() => applyFromHistory(v)}
                          className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                        >
                          Use these lyrics
                        </button>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-5 font-mono whitespace-pre-line">
                        {v.lyrics}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
