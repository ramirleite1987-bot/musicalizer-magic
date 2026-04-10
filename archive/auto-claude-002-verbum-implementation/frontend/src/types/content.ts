// Content types and enums

export enum ContentType {
  SHORT_VIDEO = "short_video",
  LONG_VIDEO = "long_video",
  BLOG_POST = "blog_post",
}

export enum ContentStatus {
  DRAFT = "draft",
  VALIDATED = "validated",
  SCHEDULED = "scheduled",
  PUBLISHED = "published",
}

// Core content item
export interface ContentItem {
  id: string;
  title: string;
  body: string;
  content_type: ContentType;
  status: ContentStatus;
  language: string;
  channels: string[];
  ai_model_used: string | null;
  prompt_used: string | null;
  scheduled_date: string | null;
  published_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// Content version snapshot
export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  body: string;
  created_at: string;
  snapshot_reason: "manual_save" | "pre_validation" | "ai_generation";
}

// Validation types
export interface Citation {
  citation_number: number;
  source_id: string;
  cited_text: string;
}

export interface ValidationResult {
  id: string;
  content_id: string;
  content_version: number;
  score: number;
  flags: string[];
  citations: Citation[];
  provider: "notebooklm" | "ai_fallback";
  raw_response: string;
  created_at: string;
  duration_ms: number;
}

// Generation request/response
export interface GenerationRequest {
  model: "claude" | "chatgpt";
  prompt: string;
  system_prompt?: string;
  content_type: ContentType;
  max_tokens?: number;
}

export interface GenerationResponse {
  text: string;
  model: string;
  done: boolean;
}

// Schedule types
export interface ScheduleRequest {
  content_id: string;
  scheduled_date: string;
  channels?: string[];
}

export interface ScheduledItem {
  content_id: string;
  title: string;
  content_type: ContentType;
  channels: string[];
  scheduled_date: string;
  status: ContentStatus;
}

// SEO metadata
export interface SEOMetadata {
  id: string;
  content_id: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  slug: string;
  readability_score: number | null;
  updated_at: string;
}

// API response wrappers
export interface ApiError {
  detail: string;
  status_code: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Dashboard summary
export interface DashboardSummary {
  total_content: number;
  by_status: Record<ContentStatus, number>;
  by_type: Record<ContentType, number>;
  upcoming_scheduled: ScheduledItem[];
  recent_validations: ValidationResult[];
}
