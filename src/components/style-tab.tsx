"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TrackVersion } from "@/types/music";

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Electronic", "Jazz", "Classical",
  "Country", "Folk", "Reggae", "Blues", "Funk", "Soul", "Metal",
  "Indie", "Alternative", "Latin", "World", "Ambient", "Cinematic",
];

const MOOD_OPTIONS = [
  "Happy", "Sad", "Energetic", "Chill", "Romantic", "Dark", "Uplifting",
  "Melancholic", "Epic", "Peaceful", "Tense", "Playful", "Mysterious",
  "Nostalgic", "Angry", "Dreamy", "Powerful", "Groovy",
];

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const VOCAL_STYLES = [
  "Male Vocals", "Female Vocals", "Mixed Vocals", "Choir",
  "Rap", "Spoken Word", "Instrumental", "Falsetto", "Baritone",
];

const DURATIONS = ["30s", "1m", "2m", "3m", "4m", "custom"];

const SUNO_VERSIONS = ["v3", "v3.5", "v4", "chirp-v3-0", "chirp-v3-5"];

const COMMON_INSTRUMENTS = [
  "Piano", "Guitar", "Bass", "Drums", "Synthesizer", "Violin",
  "Cello", "Trumpet", "Saxophone", "Flute", "Organ", "Harp",
];

interface StyleTabProps {
  version: TrackVersion;
  onChange: (updates: Partial<TrackVersion>) => void;
}

export function StyleTab({ version, onChange }: StyleTabProps) {
  const style = version.style;
  const [newInstrument, setNewInstrument] = useState("");

  const updateStyle = (updates: Partial<typeof style>) => {
    onChange({ style: { ...style, ...updates } });
  };

  const toggleMood = (mood: string) => {
    const moods = style.moods.includes(mood)
      ? style.moods.filter((m) => m !== mood)
      : [...style.moods, mood];
    updateStyle({ moods });
  };

  const toggleInstrument = (instrument: string) => {
    const instruments = style.instruments.includes(instrument)
      ? style.instruments.filter((i) => i !== instrument)
      : [...style.instruments, instrument];
    updateStyle({ instruments });
  };

  const addCustomInstrument = () => {
    const trimmed = newInstrument.trim();
    if (trimmed && !style.instruments.includes(trimmed)) {
      updateStyle({ instruments: [...style.instruments, trimmed] });
      setNewInstrument("");
    }
  };

  const removeInstrument = (instrument: string) => {
    updateStyle({ instruments: style.instruments.filter((i) => i !== instrument) });
  };

  const getTempoLabel = (tempo: number) => {
    if (tempo < 60) return "Very Slow";
    if (tempo < 80) return "Slow";
    if (tempo < 100) return "Moderate";
    if (tempo < 120) return "Medium";
    if (tempo < 140) return "Fast";
    if (tempo < 160) return "Very Fast";
    return "Extreme";
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Genre */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Genre</Label>
        <Select value={style.genre} onValueChange={(v) => v && updateStyle({ genre: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select genre" />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Moods */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Moods
          <span className="ml-1.5 text-xs font-normal text-zinc-400">
            ({style.moods.length} selected)
          </span>
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = style.moods.includes(mood);
            return (
              <button
                key={mood}
                onClick={() => toggleMood(mood)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors",
                  isSelected
                    ? "border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                {mood}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Tempo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Tempo</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{getTempoLabel(style.tempo)}</span>
            <Badge variant="secondary" className="text-xs font-mono">
              {style.tempo} BPM
            </Badge>
          </div>
        </div>
        <Slider
          value={[style.tempo]}
          onValueChange={(v) => updateStyle({ tempo: Array.isArray(v) ? v[0] : v })}
          min={40}
          max={220}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-400">
          <span>40</span>
          <span>220 BPM</span>
        </div>
      </div>

      <Separator />

      {/* Key & Scale */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Key & Scale</Label>
        <div className="flex gap-2">
          <Select value={style.key} onValueChange={(v) => v && updateStyle({ key: v })}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              {KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-md p-1">
            <button
              onClick={() => updateStyle({ isMinor: false })}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                !style.isMinor
                  ? "bg-violet-600 text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              Major
            </button>
            <button
              onClick={() => updateStyle({ isMinor: true })}
              className={cn(
                "px-3 py-1 text-xs rounded transition-colors",
                style.isMinor
                  ? "bg-violet-600 text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              Minor
            </button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Instruments */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Instruments</Label>

        {/* Quick toggles */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_INSTRUMENTS.map((instrument) => {
            const isSelected = style.instruments.includes(instrument);
            return (
              <button
                key={instrument}
                onClick={() => toggleInstrument(instrument)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors",
                  isSelected
                    ? "border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                )}
              >
                {instrument}
              </button>
            );
          })}
        </div>

        {/* Custom instruments */}
        {style.instruments.filter((i) => !COMMON_INSTRUMENTS.includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {style.instruments
              .filter((i) => !COMMON_INSTRUMENTS.includes(i))
              .map((instrument) => (
                <Badge
                  key={instrument}
                  variant="secondary"
                  className="text-xs gap-1 pr-1"
                >
                  {instrument}
                  <button
                    onClick={() => removeInstrument(instrument)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
          </div>
        )}

        {/* Add custom */}
        <div className="flex gap-2">
          <Input
            value={newInstrument}
            onChange={(e) => setNewInstrument(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomInstrument()}
            placeholder="Add custom instrument..."
            className="h-8 text-sm"
          />
          <Button
            onClick={addCustomInstrument}
            size="sm"
            variant="outline"
            className="h-8 px-2"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Vocal Style */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Vocal Style</Label>
        <Select value={style.vocalStyle} onValueChange={(v) => v && updateStyle({ vocalStyle: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select vocal style" />
          </SelectTrigger>
          <SelectContent>
            {VOCAL_STYLES.map((vs) => (
              <SelectItem key={vs} value={vs}>
                {vs}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Duration</Label>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((dur) => (
            <button
              key={dur}
              onClick={() => updateStyle({ duration: dur })}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md border transition-colors",
                style.duration === dur
                  ? "border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-700"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
              )}
            >
              {dur}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Suno API Version */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Suno API Version</Label>
        <Select
          value={style.sunoApiVersion}
          onValueChange={(v) => v && updateStyle({ sunoApiVersion: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select version" />
          </SelectTrigger>
          <SelectContent>
            {SUNO_VERSIONS.map((sv) => (
              <SelectItem key={sv} value={sv}>
                {sv}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
