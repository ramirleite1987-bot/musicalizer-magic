import React from 'react';
import { TrackVersion } from '../types/music';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'./ui/select';
import { Slider } from './ui/slider';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Badge } from './ui/badge';
import { Settings2, Activity, Music2, Clock, Mic } from 'lucide-react';
interface StyleTabProps {
  version: TrackVersion;
  onChange: (updates: Partial<TrackVersion>) => void;
}
const GENRES = [
'Electronic',
'Hip-Hop',
'Pop',
'Rock',
'Jazz',
'Classical',
'R&B',
'Ambient',
'Lo-fi',
'Cinematic',
'Synthwave'];

const MOODS = [
'Energetic',
'Melancholic',
'Uplifting',
'Dark',
'Dreamy',
'Aggressive',
'Chill',
'Romantic',
'Epic',
'Mysterious'];

const INSTRUMENTS = [
'Piano',
'Guitar',
'Synth',
'Drums',
'Bass',
'Strings',
'Brass',
'Vocals',
'Pad',
'Percussion'];

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const VOCAL_STYLES = ['None', 'Male', 'Female', 'Choir', 'Whisper', 'Rap'];
const DURATIONS = ['30s', '60s', '90s', '2min', '3min', '5min'];
const SUNO_VERSIONS = ['v3', 'v3.5', 'v4'];
export function StyleTab({ version, onChange }: StyleTabProps) {
  const updateStyle = (key: keyof TrackVersion['style'], value: any) => {
    onChange({
      style: {
        ...version.style,
        [key]: value
      }
    });
  };
  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Style Configuration
        </h2>
        <p className="text-muted-foreground text-sm">
          Fine-tune the musical characteristics of your generation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Identity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music2 className="w-4 h-4 text-muted-foreground" />
              Core Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Genre</Label>
                <Select
                  value={version.style.genre}
                  onValueChange={(v) => updateStyle('genre', v)}>
                  
                  <SelectTrigger className="w-full bg-background/50">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) =>
                    <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Suno API Version</Label>
                <Select
                  value={version.style.sunoApiVersion}
                  onValueChange={(v) => updateStyle('sunoApiVersion', v)}>
                  
                  <SelectTrigger className="w-full bg-background/50">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUNO_VERSIONS.map((v) =>
                    <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Moods</Label>
                <span className="text-xs text-muted-foreground">
                  {version.style.moods.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => {
                  const isSelected = version.style.moods.includes(mood);
                  return (
                    <Badge
                      key={mood}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted bg-background/50'}`}
                      onClick={() => {
                        const newMoods = isSelected ?
                        version.style.moods.filter((m) => m !== mood) :
                        [...version.style.moods, mood];
                        updateStyle('moods', newMoods);
                      }}>
                      
                      {mood}
                    </Badge>);

                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Musicality */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Musicality
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Tempo (BPM)</Label>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md border border-border/50">
                  {version.style.tempo}
                </span>
              </div>
              <Slider
                value={[version.style.tempo]}
                min={60}
                max={200}
                step={1}
                onValueChange={([v]) => updateStyle('tempo', v)}
                className="py-2" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>60 (Slow)</span>
                <span>130 (Dance)</span>
                <span>200 (Fast)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Key</Label>
                <Select
                  value={version.style.key}
                  onValueChange={(v) => updateStyle('key', v)}>
                  
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Key" />
                  </SelectTrigger>
                  <SelectContent>
                    {KEYS.map((k) =>
                    <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Scale</Label>
                <ToggleGroup
                  type="single"
                  value={version.style.isMinor ? 'minor' : 'major'}
                  onValueChange={(v) => {
                    if (v) updateStyle('isMinor', v === 'minor');
                  }}
                  className="justify-start bg-background/50 p-1 rounded-md border border-border/50">
                  
                  <ToggleGroupItem
                    value="major"
                    className="flex-1 text-xs h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    
                    Major
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="minor"
                    className="flex-1 text-xs h-8 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                    
                    Minor
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrumentation & Format */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm md:col-span-2">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              Instrumentation & Format
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">
                  Featured Instruments
                </Label>
                <span className="text-xs text-muted-foreground">
                  {version.style.instruments.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.map((inst) => {
                  const isSelected = version.style.instruments.includes(inst);
                  return (
                    <Badge
                      key={inst}
                      variant={isSelected ? 'secondary' : 'outline'}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary/50' : 'hover:bg-muted bg-background/50'}`}
                      onClick={() => {
                        const newInsts = isSelected ?
                        version.style.instruments.filter((i) => i !== inst) :
                        [...version.style.instruments, inst];
                        updateStyle('instruments', newInsts);
                      }}>
                      
                      {inst}
                    </Badge>);

                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Vocal Style</Label>
                <Select
                  value={version.style.vocalStyle}
                  onValueChange={(v) => updateStyle('vocalStyle', v)}>
                  
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOCAL_STYLES.map((v) =>
                    <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Target Duration
                </Label>
                <Select
                  value={version.style.duration}
                  onValueChange={(v) => updateStyle('duration', v)}>
                  
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) =>
                    <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}