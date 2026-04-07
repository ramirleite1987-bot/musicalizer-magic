'use client'

import React, { useState } from 'react';
import type { Track, Theme, ThemeSource } from '@/types/music';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'./ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'./ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
'./ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Palette,
  Link as LinkIcon,
  FileText,
  Plus,
  X,
  Wand2,
  Library,
  Loader2 } from
'lucide-react';
import { toast } from 'sonner';

interface ThemesTabProps {
  track: Track;
  themes: Theme[];
  onAssignTheme: (themeId: string) => Promise<void>;
  onRemoveTheme: (themeId: string) => Promise<void>;
  onCreateTheme: (theme: Omit<Theme, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteTheme: (themeId: string) => Promise<void>;
}

const COLOR_MAP: Record<string, string> = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  orange: 'bg-orange-500'
};

const BORDER_COLOR_MAP: Record<string, string> = {
  violet: 'border-violet-500',
  emerald: 'border-emerald-500',
  amber: 'border-amber-500',
  rose: 'border-rose-500',
  sky: 'border-sky-500',
  orange: 'border-orange-500'
};

export function ThemesTab({
  track,
  themes,
  onAssignTheme,
  onRemoveTheme,
  onCreateTheme,
  onDeleteTheme
}: ThemesTabProps) {
  const [assignSearch, setAssignSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<
    Omit<Theme, 'id' | 'createdAt'>[]>(
    []);
  const [urlInput, setUrlInput] = useState('');
  const [docInput, setDocInput] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualKeywords, setManualKeywords] = useState('');
  const [manualColor, setManualColor] = useState('violet');

  const assignedThemes = themes.filter((t) => track.themeIds.includes(t.id));
  const unassignedThemes = themes.filter(
    (t) =>
    !track.themeIds.includes(t.id) &&
    t.name.toLowerCase().includes(assignSearch.toLowerCase())
  );

  const handleGenerateThemes = (source: ThemeSource, ref: string) => {
    if (!ref.trim()) {
      toast.error('Please provide a source (URL or Document text).');
      return;
    }
    setIsGenerating(true);
    setGeneratedThemes([]);
    setTimeout(() => {
      setIsGenerating(false);
      const mockSuggestions: Omit<Theme, 'id' | 'createdAt'>[] = [];
      if (source === 'url' && ref.toLowerCase().includes('space')) {
        mockSuggestions.push(
          {
            name: 'Galactic Void',
            description: 'The cold, empty expanse of deep space.',
            keywords: ['void', 'stars', 'cold', 'silence'],
            color: 'sky',
            source: 'url',
            sourceRef: ref
          },
          {
            name: 'Nebula Dreams',
            description: 'Colorful clouds of cosmic dust and gas.',
            keywords: ['nebula', 'colors', 'dust', 'ethereal'],
            color: 'violet',
            source: 'url',
            sourceRef: ref
          },
          {
            name: 'Event Horizon',
            description: 'The point of no return near a black hole.',
            keywords: ['gravity', 'darkness', 'pull', 'inevitable'],
            color: 'rose',
            source: 'url',
            sourceRef: ref
          }
        );
      } else if (source === 'url') {
        mockSuggestions.push(
          {
            name: 'Digital Frontier',
            description: 'Exploring the vast networks of the internet.',
            keywords: ['network', 'data', 'connection', 'speed'],
            color: 'emerald',
            source: 'url',
            sourceRef: ref
          },
          {
            name: 'Information Overload',
            description: 'The chaotic stream of endless content.',
            keywords: ['chaos', 'stream', 'noise', 'overwhelm'],
            color: 'amber',
            source: 'url',
            sourceRef: ref
          },
          {
            name: 'Virtual Serenity',
            description: 'Finding peace in a simulated environment.',
            keywords: ['peace', 'simulation', 'calm', 'digital'],
            color: 'sky',
            source: 'url',
            sourceRef: ref
          }
        );
      } else if (source === 'document') {
        mockSuggestions.push(
          {
            name: 'Hidden Meanings',
            description: 'Reading between the lines of a complex text.',
            keywords: ['subtext', 'mystery', 'depth', 'analysis'],
            color: 'violet',
            source: 'document',
            sourceRef: 'Pasted Document'
          },
          {
            name: 'Narrative Arc',
            description: 'The journey from beginning to end.',
            keywords: ['journey', 'story', 'progression', 'climax'],
            color: 'orange',
            source: 'document',
            sourceRef: 'Pasted Document'
          },
          {
            name: 'Textual Echoes',
            description: 'Recurring themes and motifs in writing.',
            keywords: ['echo', 'motif', 'repetition', 'pattern'],
            color: 'rose',
            source: 'document',
            sourceRef: 'Pasted Document'
          }
        );
      }
      setGeneratedThemes(mockSuggestions);
      toast.success('Themes generated successfully!');
    }, 1500);
  };

  const handleAddGeneratedTheme = (theme: Omit<Theme, 'id' | 'createdAt'>) => {
    onCreateTheme(theme);
    setGeneratedThemes((prev) => prev.filter((t) => t.name !== theme.name));
    toast.success(`Theme "${theme.name}" added to library.`);
  };

  const handleCreateManualTheme = () => {
    if (!manualName.trim() || !manualDesc.trim()) {
      toast.error('Please provide a name and description.');
      return;
    }
    const keywords = manualKeywords.
    split(',').
    map((k) => k.trim()).
    filter((k) => k);
    onCreateTheme({
      name: manualName,
      description: manualDesc,
      keywords,
      color: manualColor,
      source: 'manual',
      sourceRef: ''
    });
    setManualName('');
    setManualDesc('');
    setManualKeywords('');
    setManualColor('violet');
    toast.success(`Theme "${manualName}" created manually.`);
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Theme & Inspiration
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage themes that inspire your tracks and guide the AI generation.
        </p>
      </div>

      {/* Assigned Themes Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Track Themes</h3>
            <p className="text-sm text-muted-foreground">
              Themes assigned to this track influence lyrics, prompts, and
              style.
            </p>
          </div>
          <Select onValueChange={onAssignTheme}>
            <SelectTrigger className="w-[250px] bg-background/50">
              <SelectValue placeholder="Assign a theme..." />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search themes..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="h-8 mb-2" />

              </div>
              {unassignedThemes.length === 0 ?
              <div className="p-2 text-sm text-muted-foreground text-center">
                  No themes found.
                </div> :

              unassignedThemes.map((t) =>
              <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <div
                    className={`w-2 h-2 rounded-full ${COLOR_MAP[t.color]}`} />

                      {t.name}
                    </div>
                  </SelectItem>
              )
              }
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedThemes.length === 0 ?
          <div className="col-span-full p-8 text-center border-2 border-dashed border-border/50 rounded-lg text-muted-foreground">
              No themes assigned to this track yet. Select one from the library
              above.
            </div> :

          assignedThemes.map((theme) =>
          <Card
            key={theme.id}
            className={`border-l-4 ${BORDER_COLOR_MAP[theme.color]} bg-card/50 backdrop-blur-sm relative overflow-hidden group`}>

                <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveTheme(theme.id)}>

                  <X className="w-3 h-3" />
                </Button>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-base">{theme.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {theme.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex flex-wrap gap-1">
                    {theme.keywords.map((kw) =>
                <Badge
                  key={kw}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-normal bg-muted/50">

                        {kw}
                      </Badge>
                )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 p-1.5 rounded-md border border-border/30">
                    {theme.source === 'url' && <LinkIcon className="w-3 h-3" />}
                    {theme.source === 'document' &&
                <FileText className="w-3 h-3" />
                }
                    {theme.source === 'manual' &&
                <Palette className="w-3 h-3" />
                }
                    <span className="truncate">
                      {theme.sourceRef || 'Manual Creation'}
                    </span>
                  </div>
                </CardContent>
              </Card>
          )
          }
        </div>
      </div>

      {/* Generate from Source Section */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-muted-foreground" />
            Generate Themes from Source
          </CardTitle>
          <CardDescription>
            Extract thematic inspiration from external content.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="url" className="w-full">
            <div className="px-6 pt-4 border-b border-border/50">
              <TabsList className="bg-muted/50 border border-border/50">
                <TabsTrigger value="url" className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="document" className="gap-2">
                  <FileText className="w-4 h-4" />
                  From Document
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="url" className="m-0 space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="bg-background/50" />

                  <Button
                    onClick={() => handleGenerateThemes('url', urlInput)}
                    disabled={isGenerating || !urlInput.trim()}
                    className="gap-2 shrink-0">

                    {isGenerating ?
                    <Loader2 className="w-4 h-4 animate-spin" /> :

                    <Wand2 className="w-4 h-4" />
                    }
                    Extract Themes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="document" className="m-0 space-y-4">
                <Textarea
                  placeholder="Paste document text here to extract themes..."
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  className="min-h-[150px] bg-background/50 resize-y" />

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleGenerateThemes('document', docInput)}
                    disabled={isGenerating || !docInput.trim()}
                    className="gap-2">

                    {isGenerating ?
                    <Loader2 className="w-4 h-4 animate-spin" /> :

                    <Wand2 className="w-4 h-4" />
                    }
                    Extract Themes
                  </Button>
                </div>
              </TabsContent>

              {/* Generated Suggestions */}
              {generatedThemes.length > 0 &&
              <div className="mt-6 pt-6 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Generated Suggestions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedThemes.map((theme, i) =>
                  <Card
                    key={i}
                    className={`border-t-2 ${BORDER_COLOR_MAP[theme.color]} bg-muted/20`}>

                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="text-sm">
                            {theme.name}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {theme.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                          <div className="flex flex-wrap gap-1">
                            {theme.keywords.slice(0, 3).map((kw) =>
                        <Badge
                          key={kw}
                          variant="outline"
                          className="text-[9px] px-1 py-0 font-normal">

                                {kw}
                              </Badge>
                        )}
                          </div>
                          <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs h-7"
                        onClick={() => handleAddGeneratedTheme(theme)}>

                            <Plus className="w-3 h-3 mr-1" />
                            Add to Library
                          </Button>
                        </CardContent>
                      </Card>
                  )}
                  </div>
                </div>
              }
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Theme Library Section */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="library"
          className="border-border/50 bg-card/50 backdrop-blur-sm rounded-lg border px-4">

          <AccordionTrigger className="hover:no-underline hover:bg-muted/30 -mx-4 px-4 rounded-t-lg transition-colors">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              <span className="font-medium text-lg">Global Theme Library</span>
              <Badge variant="secondary" className="ml-2 font-normal">
                {themes.length} Themes
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-6">
            {/* Manual Creation Form */}
            <div className="bg-muted/20 p-4 rounded-lg border border-border/50 space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Theme Manually
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="h-8 text-sm bg-background/50"
                    placeholder="e.g. Neon Nights" />

                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    {Object.keys(COLOR_MAP).map((color) =>
                    <button
                      key={color}
                      onClick={() => setManualColor(color)}
                      className={`w-8 h-8 rounded-full ${COLOR_MAP[color]} transition-transform ${manualColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`} />

                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    className="min-h-[60px] text-sm bg-background/50"
                    placeholder="A brief description of the theme..." />

                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs">Keywords (comma separated)</Label>
                  <Input
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                    className="h-8 text-sm bg-background/50"
                    placeholder="neon, synth, 80s, retro..." />

                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreateManualTheme}>
                  Create Theme
                </Button>
              </div>
            </div>

            {/* Library List */}
            <div className="space-y-2">
              {themes.map((theme) =>
              <div
                key={theme.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-md border border-border/30 hover:bg-muted/30 transition-colors group">

                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                    className={`w-3 h-3 rounded-full shrink-0 ${COLOR_MAP[theme.color]}`} />

                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">
                        {theme.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {theme.source === 'url' &&
                        <LinkIcon className="w-3 h-3" />
                        }
                          {theme.source === 'document' &&
                        <FileText className="w-3 h-3" />
                        }
                          {theme.source === 'manual' &&
                        <Palette className="w-3 h-3" />
                        }
                          <span className="truncate max-w-[150px]">
                            {theme.sourceRef || 'Manual'}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{theme.keywords.length} keywords</span>
                      </div>
                    </div>
                  </div>
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeleteTheme(theme.id)}>

                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>);
}
