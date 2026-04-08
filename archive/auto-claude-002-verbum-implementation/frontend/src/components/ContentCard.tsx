import { Link } from "react-router-dom";
import { FileText, Video, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card/Card";
import { StatusBadge } from "./StatusBadge";
import { ContentItem, ContentType } from "../types/content";

const typeIcons: Record<ContentType, React.ElementType> = {
  [ContentType.SHORT_VIDEO]: Video,
  [ContentType.LONG_VIDEO]: Video,
  [ContentType.BLOG_POST]: BookOpen,
};

const typeLabels: Record<ContentType, string> = {
  [ContentType.SHORT_VIDEO]: "Short Video",
  [ContentType.LONG_VIDEO]: "Long Video",
  [ContentType.BLOG_POST]: "Blog Post",
};

interface ContentCardProps {
  item: ContentItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const Icon = typeIcons[item.content_type] ?? FileText;

  return (
    <Link to={`/content/${item.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-base">{item.title || "Untitled"}</CardTitle>
          </div>
          <StatusBadge status={item.status} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{typeLabels[item.content_type]}</span>
            <span>v{item.version}</span>
            <span>{new Date(item.updated_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
