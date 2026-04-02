import { Clock, Eye } from "lucide-react";
import { useMemo } from "react";
import type { ContentVersion, ValidationResult } from "../types/content";
import { Button } from "./ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card/Card";
import { Textarea } from "./ui/textarea/Textarea";

const SNAPSHOT_REASON_LABELS: Record<ContentVersion["snapshot_reason"], string> = {
  manual_save: "Salvo manualmente",
  pre_validation: "Antes da valida\u00e7\u00e3o",
  ai_generation: "Gera\u00e7\u00e3o por IA",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface VersionHistoryProps {
  versions: ContentVersion[];
  validations: ValidationResult[];
  selectedVersion: ContentVersion | null;
  onSelectVersion: (version: ContentVersion | null) => void;
}

export function VersionHistory({
  versions,
  validations,
  selectedVersion,
  onSelectVersion,
}: VersionHistoryProps) {
  const validationByVersion = useMemo(() => {
    const map = new Map<number, ValidationResult>();
    for (const v of validations) {
      const existing = map.get(v.content_version);
      if (!existing || new Date(v.created_at) > new Date(existing.created_at)) {
        map.set(v.content_version, v);
      }
    }
    return map;
  }, [validations]);

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Hist\u00f3rico de Vers\u00f5es
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma vers\u00e3o dispon\u00edvel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Hist\u00f3rico de Vers\u00f5es
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Version List */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {versions.map((version) => {
            const validation = validationByVersion.get(version.version_number);
            const isSelected = selectedVersion?.id === version.id;
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onSelectVersion(isSelected ? null : version)}
                className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Vers\u00e3o {version.version_number}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(version.created_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {SNAPSHOT_REASON_LABELS[version.snapshot_reason]}
                  </span>
                  {validation && (
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        validation.score >= 80
                          ? "bg-green-100 text-green-700"
                          : validation.score >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      Nota: {validation.score}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Read-only Version Viewer */}
        {selectedVersion && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <Eye className="h-3.5 w-3.5" />
                Visualizando Vers\u00e3o {selectedVersion.version_number}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectVersion(null)}
                className="h-6 px-2 text-xs"
              >
                Fechar
              </Button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                T\u00edtulo
              </label>
              <p className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm">
                {selectedVersion.title}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Corpo
              </label>
              <Textarea
                value={selectedVersion.body}
                readOnly
                rows={8}
                className="bg-muted/50 font-mono text-xs"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
