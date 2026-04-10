import React from 'react';
import { TrackVersion } from '../types/music';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'./ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Star,
  GitBranch,
  Play,
  CopyPlus,
  UploadCloud,
  FileAudio,
  Trash2 } from
'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from
'./ui/card';
interface VersionsTabProps {
  versions: TrackVersion[];
  selectedVersionId: string;
  onSelectVersion: (id: string) => void;
  onNewVersion: () => void;
  onUpdateVersion?: (updates: Partial<TrackVersion>) => void;
}
export function VersionsTab({
  versions,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
  onUpdateVersion
}: VersionsTabProps) {
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateVersion) {
      const url = URL.createObjectURL(file);
      onUpdateVersion({
        audioFileName: file.name,
        audioUrl: url,
        status: 'complete' // Assuming uploading means it's complete
      });
    }
  };
  const handleRemoveAudio = () => {
    if (onUpdateVersion) {
      onUpdateVersion({
        audioFileName: null,
        audioUrl: null
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'generating':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-semibold tracking-tight">
            Version History
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage and compare all generations for this track.
          </p>
        </div>
        <Button
          onClick={onNewVersion}
          className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          
          <CopyPlus className="w-4 h-4" />
          Clone to New Version
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-[100px]">Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) =>
            <TableRow
              key={version.id}
              className={`cursor-pointer transition-colors border-border/50 ${version.id === selectedVersionId ? 'bg-accent/50 hover:bg-accent/70' : 'hover:bg-muted/50'}`}
              onClick={() => onSelectVersion(version.id)}>
              
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-muted-foreground" />v
                    {version.versionNumber}
                    {version.isBest &&
                  <Badge
                    variant="default"
                    className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
                    
                        Best
                      </Badge>
                  }
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                  variant="outline"
                  className={`capitalize ${getStatusColor(version.status)}`}>
                  
                    {version.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(version.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) =>
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${star <= version.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />

                  )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {version.style.duration}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary">
                  
                    <Play className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {selectedVersion &&
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm mt-6">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-muted-foreground" />
              Audio Output (v{selectedVersion.versionNumber})
            </CardTitle>
            <CardDescription>
              Upload the generated audio file from Suno for evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {selectedVersion.audioUrl ?
          <div className="space-y-4">
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-md">
                      <FileAudio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {selectedVersion.audioFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ready for playback
                      </p>
                    </div>
                  </div>
                  <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveAudio}
                className="text-destructive hover:text-destructive hover:bg-destructive/10">
                
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <audio
              controls
              src={selectedVersion.audioUrl}
              className="w-full h-12 rounded-md">
              
                  Your browser does not support the audio element.
                </audio>
              </div> :

          <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:bg-muted/20 transition-colors">
                <input
              type="file"
              id="audio-upload"
              className="hidden"
              accept="audio/*"
              onChange={handleFileUpload} />
            
                <label
              htmlFor="audio-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-3">
              
                  <div className="bg-muted p-3 rounded-full">
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Click to upload audio file
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP3, WAV, M4A up to 50MB
                    </p>
                  </div>
                  <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                asChild>
                
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
          }
          </CardContent>
        </Card>
      }
    </div>);

}