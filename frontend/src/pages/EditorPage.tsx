import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentEditor } from "../components/ContentEditor";
import { GenerationPanel } from "../components/GenerationPanel";
import { SEOPanel } from "../components/SEOPanel";
import { ValidationPanel } from "../components/ValidationPanel";
import { useContent } from "../hooks/useContent";
import type { ContentItem, ContentType, SEOMetadata } from "../types/content";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { getById, create, update } = useContent();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentId, setContentId] = useState<string>(id === "new" ? "" : id || "");
  const [seo, setSeo] = useState<SEOMetadata | null>(null);

  useEffect(() => {
    if (id && id !== "new") {
      setLoading(true);
      getById(id)
        .then((item) => {
          setContent(item);
          setContentId(item.id);
        })
        .catch(() => setContent(null))
        .finally(() => setLoading(false));
    }
  }, [id, getById]);

  const handleSave = useCallback(
    async (data: { title: string; body: string; content_type: ContentType }) => {
      if (contentId) {
        const updated = await update(contentId, data);
        setContent(updated);
      } else {
        const created = await create({ ...data, language: "pt", channels: [] });
        setContent(created);
        setContentId(created.id);
        window.history.replaceState(null, "", `/content/${created.id}`);
      }
    },
    [contentId, create, update]
  );

  const handleAcceptGenerated = useCallback((text: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, body: prev.body ? prev.body + "\n\n" + text : text };
    });
  }, []);

  const handleSeoChange = useCallback((updates: Partial<SEOMetadata>) => {
    setSeo((prev) => {
      const base: SEOMetadata = prev ?? {
        id: "",
        content_id: contentId,
        meta_title: "",
        meta_description: "",
        keywords: [],
        slug: "",
        readability_score: null,
        updated_at: "",
      };
      return { ...base, ...updates };
    });
  }, [contentId]);

  const isBlogPost = (content?.content_type || "blog_post") === "blog_post";

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {id === "new" ? "New Content" : "Edit Content"}
        </h2>

        <ContentEditor
          content={content}
          loading={loading}
          onSave={handleSave}
        />

        <GenerationPanel
          contentType={content?.content_type || ("blog_post" as ContentType)}
          onAccept={handleAcceptGenerated}
        />
      </div>

      {/* Right Panel - Validation + SEO */}
      <div className="w-96 border-l bg-gray-50 overflow-y-auto p-4 space-y-4">
        <ValidationPanel contentId={contentId} />
        {isBlogPost && (
          <SEOPanel
            seo={seo}
            onChange={handleSeoChange}
            onSuggestKeywords={() => {
              // Keyword suggestion trigger - placeholder for API integration
            }}
          />
        )}
      </div>
    </div>
  );
}
