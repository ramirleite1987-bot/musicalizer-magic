import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentEditor } from "../components/ContentEditor";
import { GenerationPanel } from "../components/GenerationPanel";
import { SEOPanel } from "../components/SEOPanel";
import { ValidationPanel } from "../components/ValidationPanel";
import { VersionHistory } from "../components/VersionHistory";
import { useContent } from "../hooks/useContent";
import { api } from "../services/api";
import type {
  ContentItem,
  ContentType,
  ContentVersion,
  SEOMetadata,
  ValidationResult,
} from "../types/content";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { getById, create, update } = useContent();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentId, setContentId] = useState<string>(id === "new" ? "" : id || "");
  const [seo, setSeo] = useState<SEOMetadata | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [validations, setValidations] = useState<ValidationResult[]>([]);

  const fetchVersions = useCallback(async (cId: string) => {
    try {
      const data = await api.get<ContentVersion[]>(`/content/${cId}/versions`);
      setVersions(data);
    } catch {
      setVersions([]);
    }
  }, []);

  const fetchValidations = useCallback(async (cId: string) => {
    try {
      const data = await api.get<ValidationResult[]>(`/content/${cId}/validations`);
      setValidations(data);
    } catch {
      setValidations([]);
    }
  }, []);

  useEffect(() => {
    if (id && id !== "new") {
      setLoading(true);
      getById(id)
        .then((item) => {
          setContent(item);
          setContentId(item.id);
          void fetchVersions(item.id);
          void fetchValidations(item.id);
        })
        .catch(() => setContent(null))
        .finally(() => setLoading(false));
    }
  }, [id, getById, fetchVersions, fetchValidations]);

  const handleSave = useCallback(
    async (data: { title: string; body: string; content_type: ContentType }) => {
      if (contentId) {
        const updated = await update(contentId, data);
        setContent(updated);
        void fetchVersions(contentId);
      } else {
        const created = await create({ ...data, language: "pt", channels: [] });
        setContent(created);
        setContentId(created.id);
        window.history.replaceState(null, "", `/content/${created.id}`);
      }
    },
    [contentId, create, update, fetchVersions]
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
          {id === "new" ? "Novo Conte\u00fado" : "Editar Conte\u00fado"}
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

      {/* Right Panel - Versions, Validation + SEO */}
      <div className="w-96 border-l bg-gray-50 overflow-y-auto p-4 space-y-4">
        {contentId && (
          <VersionHistory
            versions={versions}
            validations={validations}
            selectedVersion={selectedVersion}
            onSelectVersion={setSelectedVersion}
          />
        )}
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
