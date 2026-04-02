import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ContentItem, ContentType } from "../types/content";
import { Button } from "./ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card/Card";
import { Input } from "./ui/input/Input";
import { Textarea } from "./ui/textarea/Textarea";

interface ContentEditorProps {
  content: ContentItem | null;
  loading: boolean;
  onSave: (data: { title: string; body: string; content_type: ContentType }) => Promise<void>;
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: "short_video" as ContentType, label: "Short Video (1 min)" },
  { value: "long_video" as ContentType, label: "Long Video (10 min)" },
  { value: "blog_post" as ContentType, label: "Blog Post" },
];

export function ContentEditor({ content, loading, onSave }: ContentEditorProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [contentType, setContentType] = useState<ContentType>("blog_post" as ContentType);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) {
      setTitle(content.title);
      setBody(content.body);
      setContentType(content.content_type);
    }
  }, [content]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ title, body, content_type: contentType });
    } finally {
      setSaving(false);
    }
  }, [title, body, contentType, onSave]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <span className="text-sm text-muted-foreground">Loading content...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Content</CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="content-title" className="mb-1.5 block text-sm font-medium">
            Title
          </label>
          <Input
            id="content-title"
            placeholder="Content title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="content-type" className="mb-1.5 block text-sm font-medium">
            Type
          </label>
          <select
            id="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {CONTENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-body" className="mb-1.5 block text-sm font-medium">
            Body
          </label>
          <Textarea
            id="content-body"
            placeholder="Write your content here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
