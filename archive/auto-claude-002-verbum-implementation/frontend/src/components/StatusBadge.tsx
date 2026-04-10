import { ContentStatus } from "../types/content";
import { Badge } from "./ui/badge/Badge";

const statusConfig: Record<ContentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [ContentStatus.DRAFT]: { label: "Draft", variant: "secondary" },
  [ContentStatus.VALIDATED]: { label: "Validated", variant: "default" },
  [ContentStatus.SCHEDULED]: { label: "Scheduled", variant: "outline" },
  [ContentStatus.PUBLISHED]: { label: "Published", variant: "default" },
};

interface StatusBadgeProps {
  status: ContentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
