import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { CitationList } from "./CitationList";
import { useValidation } from "../hooks/useValidation";

interface ValidationPanelProps {
  contentId: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function getProgressColor(score: number): string {
  if (score >= 80) return "[&>div]:bg-green-500";
  if (score >= 50) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

export function ValidationPanel({ contentId }: ValidationPanelProps) {
  const { result, history, validating, loading, error, validate, fetchHistory } =
    useValidation();

  useEffect(() => {
    if (contentId) {
      void fetchHistory(contentId);
    }
  }, [contentId, fetchHistory]);

  const handleValidate = () => {
    void validate(contentId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="h-4 w-4" />
          Theological Validation
        </CardTitle>
        <Button
          size="sm"
          onClick={handleValidate}
          disabled={validating || !contentId}
        >
          {validating ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Validating…
            </>
          ) : (
            "Validate"
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading && !result && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {result && (
          <>
            {/* Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </span>
              </div>
              <Progress
                value={result.score}
                className={`h-2 ${getProgressColor(result.score)}`}
              />
            </div>

            {/* Provider */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <Badge variant={result.provider === "notebooklm" ? "default" : "secondary"}>
                {result.provider === "notebooklm" ? "NotebookLM" : "AI Fallback"}
              </Badge>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm">{(result.duration_ms / 1000).toFixed(1)}s</span>
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Flags</span>
                <ul className="space-y-1">
                  {result.flags.map((flag, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-yellow-700"
                    >
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.flags.length === 0 && result.score >= 80 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                No doctrinal issues found
              </div>
            )}

            {/* Citations */}
            {result.citations.length > 0 && (
              <CitationList citations={result.citations} />
            )}
          </>
        )}

        {!result && !loading && !error && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Click &quot;Validate&quot; to check theological accuracy
          </p>
        )}

        {/* History count */}
        {history.length > 1 && (
          <div className="border-t pt-2">
            <span className="text-xs text-muted-foreground">
              {history.length} validations in history
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
