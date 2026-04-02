import { FileText, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/badge/Badge";
import { Button } from "../components/ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select/Select";
import { useContent } from "../hooks/useContent";
import { ContentStatus, ContentType } from "../types/content";
import type { ContentItem } from "../types/content";

const STATUS_LABELS: Record<ContentStatus, string> = {
  [ContentStatus.DRAFT]: "Draft",
  [ContentStatus.VALIDATED]: "Validated",
  [ContentStatus.SCHEDULED]: "Scheduled",
  [ContentStatus.PUBLISHED]: "Published",
};

const TYPE_LABELS: Record<ContentType, string> = {
  [ContentType.SHORT_VIDEO]: "Short Video",
  [ContentType.LONG_VIDEO]: "Long Video",
  [ContentType.BLOG_POST]: "Blog Post",
};

const STATUS_VARIANT: Record<ContentStatus, "default" | "secondary" | "outline"> = {
  [ContentStatus.DRAFT]: "secondary",
  [ContentStatus.VALIDATED]: "outline",
  [ContentStatus.SCHEDULED]: "default",
  [ContentStatus.PUBLISHED]: "default",
};

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <Link to={`/content/${item.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
            <Badge variant={STATUS_VARIANT[item.status]}>
              {STATUS_LABELS[item.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.body || "No content yet."}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{TYPE_LABELS[item.content_type]}</span>
            <span>·</span>
            <span>{new Date(item.updated_at).toLocaleDateString()}</span>
            {item.version > 1 && (
              <>
                <span>·</span>
                <span>v{item.version}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ContentListPage() {
  const { items, loading, error, filters, setFilters } = useContent();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Content</h2>
        <Button asChild>
          <Link to="/content/new">
            <Plus className="h-4 w-4 mr-2" />
            New Content
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={filters.status ?? ""}
          onValueChange={(value) =>
            setFilters({ ...filters, status: (value || undefined) as ContentStatus | undefined, page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.values(ContentStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.content_type ?? ""}
          onValueChange={(value) =>
            setFilters({ ...filters, content_type: (value || undefined) as ContentType | undefined, page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {Object.values(ContentType).map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">
            No content items yet. Create your first piece of content to get started.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
