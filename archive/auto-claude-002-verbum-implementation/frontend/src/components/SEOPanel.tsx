import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "./ui/button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card/Card";
import { Input } from "./ui/input/Input";
import { Textarea } from "./ui/textarea/Textarea";
import type { SEOMetadata } from "../types/content";

interface SEOPanelProps {
  seo: SEOMetadata | null;
  onChange: (updates: Partial<SEOMetadata>) => void;
  onSuggestKeywords?: () => void;
}

export function SEOPanel({ seo, onChange, onSuggestKeywords }: SEOPanelProps) {
  const [keywordInput, setKeywordInput] = useState("");

  const metaTitle = seo?.meta_title ?? "";
  const metaDescription = seo?.meta_description ?? "";
  const slug = seo?.slug ?? "";
  const keywords = seo?.keywords ?? [];
  const readabilityScore = seo?.readability_score ?? null;

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange({ keywords: [...keywords, trimmed] });
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    onChange({ keywords: keywords.filter((k) => k !== keyword) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const scoreColor =
    readabilityScore === null
      ? "text-gray-400"
      : readabilityScore >= 70
        ? "text-green-600"
        : readabilityScore >= 40
          ? "text-yellow-600"
          : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          SEO Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Meta Title
          </label>
          <Input
            value={metaTitle}
            onChange={(e) => onChange({ meta_title: e.target.value })}
            placeholder="Page title for search engines"
            maxLength={70}
          />
          <p className="mt-1 text-xs text-gray-500">{metaTitle.length}/70</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Meta Description
          </label>
          <Textarea
            value={metaDescription}
            onChange={(e) => onChange({ meta_description: e.target.value })}
            placeholder="Brief description for search results"
            rows={3}
            maxLength={160}
          />
          <p className="mt-1 text-xs text-gray-500">{metaDescription.length}/160</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            URL Slug
          </label>
          <Input
            value={slug}
            onChange={(e) =>
              onChange({
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .replace(/-+/g, "-"),
              })
            }
            placeholder="url-friendly-slug"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Keywords
          </label>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a keyword"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleAddKeyword}>
              Add
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
                >
                  {kw}
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="ml-0.5 text-gray-400 hover:text-gray-600"
                    aria-label={`Remove ${kw}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {onSuggestKeywords && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSuggestKeywords}
              className="mt-2"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Suggest Keywords
            </Button>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Readability Score
          </label>
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {readabilityScore !== null ? `${readabilityScore}/100` : "—"}
          </div>
          <p className="text-xs text-gray-500">
            {readabilityScore === null
              ? "Save content to calculate score"
              : readabilityScore >= 70
                ? "Good readability"
                : readabilityScore >= 40
                  ? "Needs improvement"
                  : "Poor readability"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
