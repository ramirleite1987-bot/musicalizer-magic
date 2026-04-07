import React from 'react';
import { TrackVersion } from '../types/music';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'./ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Star,
  Trophy,
  ArrowRight,
  Activity,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle } from
'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip } from
'recharts';
interface EvaluateTabProps {
  version: TrackVersion;
  bestVersion: TrackVersion | null;
  onChange: (updates: Partial<TrackVersion>) => void;
  onMarkBest: () => void;
}
const DIMENSIONS = [
{
  key: 'melody',
  label: 'Melody'
},
{
  key: 'harmony',
  label: 'Harmony'
},
{
  key: 'rhythm',
  label: 'Rhythm'
},
{
  key: 'production',
  label: 'Production'
},
{
  key: 'lyricsFit',
  label: 'Lyrics Fit'
},
{
  key: 'originality',
  label: 'Originality'
},
{
  key: 'emotionalImpact',
  label: 'Impact'
}] as
const;
export function EvaluateTab({
  version,
  bestVersion,
  onChange,
  onMarkBest
}: EvaluateTabProps) {
  const updateDimension = (
  key: keyof TrackVersion['dimensionScores'],
  value: number) =>
  {
    onChange({
      dimensionScores: {
        ...version.dimensionScores,
        [key]: value
      }
    });
  };
  const updateFeedback = (
  key: keyof TrackVersion['feedback'],
  value: string) =>
  {
    onChange({
      feedback: {
        ...version.feedback,
        [key]: value
      }
    });
  };
  const chartData = DIMENSIONS.map((dim) => ({
    subject: dim.label,
    current: version.dimensionScores[dim.key],
    best: bestVersion ? bestVersion.dimensionScores[dim.key] : 0,
    fullMark: 10
  }));
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-semibold tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Evaluation & Feedback
          </h2>
          <p className="text-muted-foreground text-sm">
            Rate this generation to guide future improvements.
          </p>
        </div>
        <Button
          onClick={onMarkBest}
          variant={version.isBest ? 'secondary' : 'default'}
          className={`gap-2 transition-all ${version.isBest ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 'bg-primary hover:bg-primary/90 shadow-sm'}`}
          disabled={version.isBest}>
          
          <Trophy
            className={`w-4 h-4 ${version.isBest ? 'fill-current' : ''}`} />
          
          {version.isBest ? 'Current Best Version' : 'Mark as Best Version'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scoring Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Overall Rating</CardTitle>
                <div className="flex items-center gap-1.5 bg-background/50 p-2 rounded-lg border border-border/50">
                  {[1, 2, 3, 4, 5].map((star) =>
                  <button
                    key={star}
                    onClick={() =>
                    onChange({
                      rating: star
                    })
                    }
                    className="focus:outline-none transition-transform hover:scale-110">
                    
                      <Star
                      className={`w-8 h-8 ${star <= version.rating ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-muted-foreground/30 hover:text-yellow-500/50'}`} />
                    
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {DIMENSIONS.map((dim) =>
                <div key={dim.key} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">{dim.label}</Label>
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md border border-border/50 w-8 text-center">
                        {version.dimensionScores[dim.key]}
                      </span>
                    </div>
                    <Slider
                    value={[version.dimensionScores[dim.key]]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={([v]) => updateDimension(dim.key, v)}
                    className="py-2" />
                  
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Structured Feedback
              </CardTitle>
              <CardDescription>
                Provide specific feedback to improve future generations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2 text-green-500">
                    <ThumbsUp className="w-4 h-4" />
                    Music Positives
                  </Label>
                  <Textarea
                    value={version.feedback.musicPositives}
                    onChange={(e) =>
                    updateFeedback('musicPositives', e.target.value)
                    }
                    placeholder="What worked well musically?"
                    className="min-h-[100px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-sm" />
                  
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <ThumbsDown className="w-4 h-4" />
                    Music Negatives
                  </Label>
                  <Textarea
                    value={version.feedback.musicNegatives}
                    onChange={(e) =>
                    updateFeedback('musicNegatives', e.target.value)
                    }
                    placeholder="What didn't work musically?"
                    className="min-h-[100px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-sm" />
                  
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2 text-green-500">
                    <ThumbsUp className="w-4 h-4" />
                    Lyrics Positives
                  </Label>
                  <Textarea
                    value={version.feedback.lyricsPositives}
                    onChange={(e) =>
                    updateFeedback('lyricsPositives', e.target.value)
                    }
                    placeholder="What worked well lyrically?"
                    className="min-h-[100px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-sm" />
                  
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <ThumbsDown className="w-4 h-4" />
                    Lyrics Negatives
                  </Label>
                  <Textarea
                    value={version.feedback.lyricsNegatives}
                    onChange={(e) =>
                    updateFeedback('lyricsNegatives', e.target.value)
                    }
                    placeholder="What didn't work lyrically?"
                    className="min-h-[100px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-sm" />
                  
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Label className="text-sm font-medium flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-4 h-4" />
                  Things to Avoid (Next Version)
                </Label>
                <Textarea
                  value={version.feedback.thingsToAvoid}
                  onChange={(e) =>
                  updateFeedback('thingsToAvoid', e.target.value)
                  }
                  placeholder="Specific elements to avoid in the next generation..."
                  className="min-h-[100px] resize-y bg-background/50 border-border/50 focus-visible:ring-primary/50 text-sm" />
                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm h-full">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg">Dimension Analysis</CardTitle>
              <CardDescription>Current vs Best Version</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center h-[calc(100%-80px)]">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={chartData}>
                    
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: 'var(--muted-foreground)',
                        fontSize: 12
                      }} />
                    
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 10]}
                      tick={false}
                      axisLine={false} />
                    
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.3} />
                    
                    {bestVersion && bestVersion.id !== version.id &&
                    <Radar
                      name="Best"
                      dataKey="best"
                      stroke="var(--yellow-500)"
                      fill="var(--yellow-500)"
                      fillOpacity={0.1}
                      strokeDasharray="3 3" />

                    }
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px'
                      }}
                      itemStyle={{
                        color: 'var(--foreground)'
                      }} />
                    
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {bestVersion && bestVersion.id !== version.id &&
              <div className="mt-6 w-full space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Comparison to Best (v{bestVersion.versionNumber})
                  </h4>
                  <div className="space-y-2">
                    {DIMENSIONS.map((dim) => {
                    const diff =
                    version.dimensionScores[dim.key] -
                    bestVersion.dimensionScores[dim.key];
                    if (diff === 0) return null;
                    return (
                      <div
                        key={dim.key}
                        className="flex items-center justify-between text-sm">
                        
                          <span className="text-muted-foreground">
                            {dim.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              {bestVersion.dimensionScores[dim.key]}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span
                            className={`font-mono font-medium ${diff > 0 ? 'text-green-500' : 'text-destructive'}`}>
                            
                              {version.dimensionScores[dim.key]}
                              <span className="text-xs ml-1">
                                ({diff > 0 ? '+' : ''}
                                {diff})
                              </span>
                            </span>
                          </div>
                        </div>);

                  })}
                  </div>
                </div>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

}