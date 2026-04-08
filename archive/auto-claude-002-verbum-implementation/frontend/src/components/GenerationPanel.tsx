import { Loader2, Sparkles, Square } from "lucide-react";
import { useState } from "react";
import { useGeneration } from "../hooks/useGeneration";
import type { ContentType, GenerationRequest } from "../types/content";
import { Button } from "./ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card/Card";
import { Textarea } from "./ui/textarea/Textarea";

interface GenerationPanelProps {
  contentType: ContentType;
  onAccept?: (text: string) => void;
}

const MODEL_OPTIONS: { value: GenerationRequest["model"]; label: string }[] = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "chatgpt", label: "ChatGPT (OpenAI)" },
];

export function GenerationPanel({ contentType, onAccept }: GenerationPanelProps) {
  const [model, setModel] = useState<GenerationRequest["model"]>("claude");
  const [prompt, setPrompt] = useState("");
  const { status, output, error, generate, cancel, reset } = useGeneration();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate({ model, prompt: prompt.trim(), content_type: contentType });
  };

  const handleAccept = () => {
    if (output && onAccept) {
      onAccept(output);
      reset();
      setPrompt("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="model-select" className="mb-1.5 block text-sm font-medium">
            AI Model
          </label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value as GenerationRequest["model"])}
            disabled={status === "generating"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prompt-input" className="mb-1.5 block text-sm font-medium">
            Prompt
          </label>
          <Textarea
            id="prompt-input"
            placeholder="Describe the content you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={status === "generating"}
            rows={4}
          />
        </div>

        <div className="flex gap-2">
          {status === "generating" ? (
            <Button variant="destructive" size="sm" onClick={cancel}>
              <Square className="mr-1.5 h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {(output || status === "generating") && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              Output
              {status === "generating" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm">
              {output || "Generating..."}
            </div>
            {output && status === "idle" && onAccept && (
              <Button size="sm" variant="outline" onClick={handleAccept}>
                Accept &amp; Insert
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
