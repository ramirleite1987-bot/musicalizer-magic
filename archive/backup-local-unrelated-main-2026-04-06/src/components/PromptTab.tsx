'use client'

import React from 'react';
import type { TrackVersion } from '@/types/music';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Sparkles } from 'lucide-react';

interface PromptTabProps {
  version: TrackVersion;
  onUpdate: (updates: Partial<TrackVersion>) => Promise<void>;
}

export function PromptTab({ version, onUpdate }: PromptTabProps) {
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
              onUpdate({
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
              onUpdate({
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
    </div>);
}
