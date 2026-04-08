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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
'./ui/accordion';
import { History, Sparkles } from 'lucide-react';
interface PromptTabProps {
  version: TrackVersion;
  history: TrackVersion[];
  onChange: (updates: Partial<TrackVersion>) => void;
}
export function PromptTab({ version, history, onChange }: PromptTabProps) {
  const previousVersions = history.
  filter((v) => v.id !== version.id).
  sort((a, b) => b.versionNumber - a.versionNumber);
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Generation Prompt
        </h2>
        <p className="text-muted-foreground text-sm">
          Describe the music you want to generate in detail.
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-medium">
              Main Prompt
            </Label>
            <Textarea
              id="prompt"
              value={version.prompt}
              onChange={(e) =>
              onChange({
                prompt: e.target.value
              })
              }
              placeholder="e.g. A fast-paced cyberpunk synthwave track with heavy bass and distorted leads..."
              className="min-h-[150px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-base leading-relaxed" />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Be specific about instruments, mood, and pacing.</span>
              <span>{version.prompt.length} chars</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="negativePrompt"
              className="text-base font-medium text-destructive/80">
              
              Negative Prompt
            </Label>
            <Textarea
              id="negativePrompt"
              value={version.negativePrompt}
              onChange={(e) =>
              onChange({
                negativePrompt: e.target.value
              })
              }
              placeholder="e.g. vocals, acoustic instruments, slow, muddy mix..."
              className="min-h-[80px] resize-y bg-destructive/5 border-destructive/20 focus-visible:ring-destructive/50" />
            
            <p className="text-xs text-muted-foreground">
              Elements you want the AI to avoid generating.
            </p>
          </div>
        </CardContent>
      </Card>

      {previousVersions.length > 0 &&
      <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-border/50">
            <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-4 rounded-md transition-colors">
              <div className="flex items-center gap-2 text-muted-foreground">
                <History className="w-4 h-4" />
                <span>
                  Prompt History ({previousVersions.length} previous versions)
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
                  <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded border border-border/30">
                    {prev.prompt ||
                <span className="italic opacity-50">No prompt</span>
                }
                  </div>
                  {prev.negativePrompt &&
              <div className="text-xs text-destructive/70 bg-destructive/5 p-2 rounded border border-destructive/10">
                      <span className="font-semibold mr-1">Negative:</span>
                      {prev.negativePrompt}
                    </div>
              }
                </div>
            )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      }
    </div>);

}