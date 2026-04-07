# Specification: Verbum — Catholic Content Management Platform

## Overview

Verbum is a greenfield, single-user Catholic content management platform for Ramir, a Portuguese-speaking Catholic content creator. The platform centralizes the full content lifecycle — from AI-assisted generation (via Anthropic Claude and OpenAI ChatGPT) through theological validation (via NotebookLM), editorial scheduling, and multi-channel delivery. It supports three content types: short-form video scripts (1 min), long-form video scripts (10 min), and SEO-optimized blog posts in Portuguese. The goal is to reduce time-to-publish by 50%, ensure 100% doctrinal accuracy through automated validation, and maintain a consistent publishing cadence of at least 3 pieces per week. The entire system is designed for a single user — no multi-tenancy, no scaling concerns, no monetization.

## Workflow Type

**Type**: feature

**Rationale**: This is a brand-new full-stack application being built from scratch within an empty repository. There is no existing application logic to refactor or migrate — only a Vite/React/Tailwind prototype shell (`prototypes-magic/`) with reusable UI components. Every layer (database schema, backend API, service integrations, frontend pages) must be designed and implemented.

## Task Scope

### Services Involved
- **verbum-backend** (primary) — Python FastAPI backend handling API routing, AI integration orchestration, NotebookLM validation, database persistence, and scheduling logic
- **verbum-frontend** (primary) — React TypeScript SPA providing the dashboard, content editor, validation panel, editorial calendar, and SEO tools
- **SQLite database** (infrastructure) — Embedded file-based database for content items, validation records, scheduling metadata, and version history

### This Task Will:
- [ ] Set up the full project structure (backend + frontend monorepo)
- [ ] Implement the Python FastAPI backend with async architecture
- [ ] Design and create the SQLite database schema via SQLModel
- [ ] Integrate Anthropic Claude API for AI content generation with streaming
- [ ] Integrate OpenAI ChatGPT API as an alternate drafting engine with streaming
- [ ] Integrate NotebookLM (via `notebooklm-py`) for theological validation with citation retrieval
- [ ] Build a validation abstraction layer to enable graceful degradation and provider swapping
- [ ] Create the React frontend with dashboard, content editor, validation panel, and calendar views
- [ ] Implement the full content lifecycle: draft → validated → scheduled → published
- [ ] Add Portuguese SEO metadata tools for blog post optimization
- [ ] Implement content versioning and validation history tracking
- [ ] Add iCal export for editorial calendar reminders
- [ ] Implement environment-based configuration with secure API key management

### Out of Scope:
- Custom Catholic knowledge base or RAG pipeline (NotebookLM handles this)
- Social media analytics or community management
- Monetization or revenue features
- Multi-user authentication or multi-tenancy
- Direct Google Calendar API integration (using .ics export instead)
- Bulk social media publishing automation
- Mobile native app (responsive web only)
- Docker containerization (single-user local/hosted deployment)

## Service Context

### verbum-backend

**Tech Stack:**
- Language: Python 3.11+
- Framework: FastAPI >= 0.135.0 (with `[standard]` extras for uvicorn)
- ORM: SQLModel >= 0.0.37 (Pydantic + SQLAlchemy combined)
- Database: SQLite (via aiosqlite for async operations)
- AI SDKs: `anthropic >= 0.88.0`, `openai >= 2.30.0`
- Validation: `notebooklm-py[browser] >= 0.3.4` (UNOFFICIAL — HIGH RISK)
- Calendar: `icalendar` for .ics export
- Config: `python-dotenv` for environment variable management
- Key directories: `backend/app/`, `backend/app/api/`, `backend/app/models/`, `backend/app/services/`, `backend/app/core/`

**Entry Point:** `backend/app/main.py`

**How to Run:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Port:** 8000

---

### verbum-frontend

**Tech Stack:**
- Language: TypeScript 5.5+
- Framework: React 18.3
- Bundler: Vite 5.2
- Styling: Tailwind CSS 3.4
- Icons: lucide-react 0.522
- UI Components: Reuse from `prototypes-magic/src/components/ui/` (Button, Input, Select, Card, Tabs, Badge, Table, Textarea, Progress, etc.)
- Charts: recharts (already in prototype dependencies)
- Key directories: `frontend/src/`, `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`, `frontend/src/hooks/`

**Entry Point:** `frontend/src/main.tsx`

**How to Run:**
```bash
cd frontend
npm install
npm run dev
```

**Port:** 5173 (Vite default)

## Files to Create

### Backend Structure

| File | Service | Purpose |
|------|---------|---------|
| `backend/requirements.txt` | backend | Python dependencies |
| `backend/app/__init__.py` | backend | Package init |
| `backend/app/main.py` | backend | FastAPI app entry point, middleware, CORS, lifespan |
| `backend/app/core/__init__.py` | backend | Core package init |
| `backend/app/core/config.py` | backend | Settings class with env var loading (Pydantic BaseSettings) |
| `backend/app/core/database.py` | backend | Async SQLite engine, session factory, DB initialization |
| `backend/app/core/deps.py` | backend | FastAPI dependency injection (DB sessions, service instances) |
| `backend/app/models/__init__.py` | backend | Models package init |
| `backend/app/models/content.py` | backend | Content SQLModel (type, status, language, channel, versions) |
| `backend/app/models/validation.py` | backend | ValidationRecord SQLModel (score, flags, citations, history) |
| `backend/app/models/schedule.py` | backend | Schedule SQLModel (date, channel, status, reminders) |
| `backend/app/schemas/__init__.py` | backend | Schemas package init |
| `backend/app/schemas/content.py` | backend | Pydantic request/response schemas for content endpoints |
| `backend/app/schemas/validation.py` | backend | Pydantic schemas for validation responses |
| `backend/app/schemas/generation.py` | backend | Pydantic schemas for AI generation requests/responses |
| `backend/app/services/__init__.py` | backend | Services package init |
| `backend/app/services/ai_service.py` | backend | Abstraction layer for Claude + ChatGPT with streaming |
| `backend/app/services/claude_provider.py` | backend | Anthropic Claude API implementation |
| `backend/app/services/openai_provider.py` | backend | OpenAI ChatGPT API implementation |
| `backend/app/services/validation_service.py` | backend | Validation abstraction layer (interface/protocol) |
| `backend/app/services/notebooklm_provider.py` | backend | NotebookLM implementation with retry + error handling |
| `backend/app/services/fallback_validation_provider.py` | backend | AI-based fallback validation if NotebookLM is down |
| `backend/app/services/content_service.py` | backend | Content CRUD, versioning, status transitions |
| `backend/app/services/schedule_service.py` | backend | Scheduling logic, calendar export |
| `backend/app/services/seo_service.py` | backend | Portuguese SEO metadata, readability, keyword suggestions |
| `backend/app/api/__init__.py` | backend | API package init |
| `backend/app/api/content.py` | backend | Content CRUD endpoints |
| `backend/app/api/generation.py` | backend | AI generation endpoints (with SSE streaming) |
| `backend/app/api/validation.py` | backend | Theological validation endpoints |
| `backend/app/api/schedule.py` | backend | Scheduling and calendar endpoints |
| `backend/app/api/seo.py` | backend | SEO analysis endpoints |
| `backend/app/api/dashboard.py` | backend | Dashboard aggregation endpoints |
| `backend/.env.example` | backend | Environment variable template |
| `backend/tests/__init__.py` | backend | Tests package init |
| `backend/tests/conftest.py` | backend | Pytest fixtures (test DB, mock services) |
| `backend/tests/test_content.py` | backend | Content CRUD tests |
| `backend/tests/test_generation.py` | backend | AI generation tests (mocked) |
| `backend/tests/test_validation.py` | backend | Validation service tests (mocked) |
| `backend/tests/test_schedule.py` | backend | Schedule and calendar export tests |
| `backend/tests/test_seo.py` | backend | SEO service tests (readability, keywords, metadata) |

### Frontend Structure

| File | Service | Purpose |
|------|---------|---------|
| `frontend/package.json` | frontend | Node dependencies and scripts |
| `frontend/tsconfig.json` | frontend | TypeScript configuration |
| `frontend/tsconfig.node.json` | frontend | TypeScript config for Vite |
| `frontend/vite.config.ts` | frontend | Vite configuration with proxy to backend |
| `frontend/tailwind.config.js` | frontend | Tailwind CSS configuration |
| `frontend/postcss.config.js` | frontend | PostCSS configuration |
| `frontend/index.html` | frontend | HTML entry point |
| `frontend/src/main.tsx` | frontend | React app entry point |
| `frontend/src/App.tsx` | frontend | Root component with routing |
| `frontend/src/index.css` | frontend | Global styles + Tailwind imports |
| `frontend/src/types/content.ts` | frontend | TypeScript types for content, validation, schedule |
| `frontend/src/services/api.ts` | frontend | API client (fetch wrapper with error handling) |
| `frontend/src/services/streaming.ts` | frontend | SSE streaming client for AI generation |
| `frontend/src/hooks/useContent.ts` | frontend | Content CRUD hook |
| `frontend/src/hooks/useGeneration.ts` | frontend | AI generation hook with streaming state |
| `frontend/src/hooks/useValidation.ts` | frontend | Validation trigger + result hook |
| `frontend/src/hooks/useSchedule.ts` | frontend | Schedule management hook |
| `frontend/src/pages/DashboardPage.tsx` | frontend | Pipeline summary, status counts, mini-calendar |
| `frontend/src/pages/EditorPage.tsx` | frontend | Content editor with validation panel |
| `frontend/src/pages/CalendarPage.tsx` | frontend | Week/month editorial calendar view |
| `frontend/src/pages/ContentListPage.tsx` | frontend | All content items with filtering by status/type |
| `frontend/src/components/ContentEditor.tsx` | frontend | Single-column rich text editor |
| `frontend/src/components/ValidationPanel.tsx` | frontend | Right-anchored validation score, flags, citations |
| `frontend/src/components/GenerationPanel.tsx` | frontend | AI model selector + prompt input + streaming output |
| `frontend/src/components/CalendarView.tsx` | frontend | Week/month calendar grid with content items |
| `frontend/src/components/ContentCard.tsx` | frontend | Content item card with status badge and type icon |
| `frontend/src/components/StatusBadge.tsx` | frontend | Color-coded status badges (draft/validated/scheduled/published) |
| `frontend/src/components/SEOPanel.tsx` | frontend | Portuguese SEO metadata editor + readability score |
| `frontend/src/components/CitationList.tsx` | frontend | Expandable citation display from NotebookLM |
| `frontend/src/components/ChannelSelector.tsx` | frontend | Channel tagging component (YouTube, Blog, etc.) |
| `frontend/src/components/ui/` | frontend | Copy/adapt UI primitives from `prototypes-magic/src/components/ui/` |

### Root Files

| File | Purpose |
|------|---------|
| `.env.example` | Root-level environment variable template |
| `README.md` | Project overview and setup instructions |

## Files to Reference (Existing Patterns)

These files from `prototypes-magic/` demonstrate patterns to reuse:

| File | Pattern to Copy |
|------|----------------|
| `prototypes-magic/src/components/ui/button/Button.tsx` | Button component with CVA variants — reuse for all interactive elements |
| `prototypes-magic/src/components/ui/card/Card.tsx` | Card layout component — reuse for content cards, dashboard cards |
| `prototypes-magic/src/components/ui/input/Input.tsx` | Input component styling — reuse for forms |
| `prototypes-magic/src/components/ui/select/Select.tsx` | Select dropdown component — reuse for model selector, content type picker |
| `prototypes-magic/src/components/ui/tabs/Tabs.tsx` | Tabs component — reuse for editor/validation/SEO tab switching |
| `prototypes-magic/src/components/ui/badge/Badge.tsx` | Badge component — adapt for status badges |
| `prototypes-magic/src/components/ui/textarea/Textarea.tsx` | Textarea styling — reuse for prompt input, editor |
| `prototypes-magic/src/components/ui/table/Table.tsx` | Table component — reuse for content list, validation history |
| `prototypes-magic/src/components/ui/progress/Progress.tsx` | Progress bar — reuse for validation score display |
| `prototypes-magic/tailwind.config.js` | Tailwind theme configuration — extend for Verbum's color palette |
| `prototypes-magic/vite.config.ts` | Vite configuration — use as base, add API proxy |
| `prototypes-magic/package.json` | Dependency baseline — reuse core deps, add routing + calendar libs |

## Patterns to Follow

### Pattern 1: Async FastAPI with SQLModel

Industry best practice for Python async web applications:

```python
# backend/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.api import content, generation, validation, schedule, seo, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Verbum API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(validation.router, prefix="/api/validation", tags=["validation"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(seo.router, prefix="/api/seo", tags=["seo"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
```

**Key Points:**
- Use `lifespan` context manager for database initialization (not deprecated `@app.on_event`)
- Configure CORS for frontend-backend communication
- Organize endpoints into routers with prefixes and tags
- All handlers should be `async def` for non-blocking I/O

### Pattern 2: SQLModel Data Models with Status Enum

```python
# backend/app/models/content.py
from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field
from uuid import uuid4

class ContentType(str, Enum):
    SHORT_VIDEO = "short_video"
    LONG_VIDEO = "long_video"
    BLOG_POST = "blog_post"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"

class ContentItem(SQLModel, table=True):
    __tablename__ = "content_items"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    body: str = ""
    content_type: ContentType
    status: ContentStatus = ContentStatus.DRAFT
    language: str = "pt"
    channels: str = "[]"  # JSON list of channel strings, e.g. '["youtube", "blog"]'
    ai_model_used: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = 1
```

**Key Points:**
- Use string enums for readable database values
- UUID primary keys for content items
- Default to Portuguese language (`pt`)
- Track which AI model generated the draft
- Version counter for content versioning

### Pattern 3: AI Service Abstraction with Streaming

```python
# backend/app/services/ai_service.py
from typing import Protocol, AsyncIterator

class AIProvider(Protocol):
    async def generate(self, prompt: str, system_prompt: str, max_tokens: int) -> str: ...
    async def generate_stream(self, prompt: str, system_prompt: str, max_tokens: int) -> AsyncIterator[str]: ...

class AIService:
    def __init__(self, providers: dict[str, AIProvider]):
        self._providers = providers

    async def generate(self, model_key: str, prompt: str, system_prompt: str, max_tokens: int = 2048) -> str:
        provider = self._providers[model_key]
        return await provider.generate(prompt, system_prompt, max_tokens)

    async def generate_stream(self, model_key: str, prompt: str, system_prompt: str, max_tokens: int = 2048) -> AsyncIterator[str]:
        provider = self._providers[model_key]
        async for chunk in provider.generate_stream(prompt, system_prompt, max_tokens):
            yield chunk
```

**Key Points:**
- Use Python `Protocol` for interface definition (structural typing)
- Support both full-response and streaming generation
- Provider pattern allows easy addition of new AI models
- The `model_key` selects between Claude and ChatGPT

### Pattern 4: Validation Service with Fallback

```python
# backend/app/services/validation_service.py
from typing import Protocol
from dataclasses import dataclass

@dataclass
class Citation:
    citation_number: int
    source_id: str
    cited_text: str

@dataclass
class ValidationResult:
    score: float  # 0.0 to 1.0
    flags: list[str]
    citations: list[Citation]
    provider: str  # "notebooklm" or "ai_fallback"
    raw_answer: str

class ValidationProvider(Protocol):
    async def validate(self, content: str, content_type: str) -> ValidationResult: ...
    async def is_available(self) -> bool: ...

class ValidationService:
    def __init__(self, primary: ValidationProvider, fallback: ValidationProvider):
        self._primary = primary
        self._fallback = fallback

    async def validate(self, content: str, content_type: str) -> ValidationResult:
        if await self._primary.is_available():
            try:
                return await self._primary.validate(content, content_type)
            except Exception:
                pass
        return await self._fallback.validate(content, content_type)
```

**Key Points:**
- Abstraction layer critical for NotebookLM reliability concerns
- `is_available()` check before attempting validation
- Automatic fallback to AI-based validation if NotebookLM is down
- Structured `ValidationResult` with score, flags, and traceable citations
- The `provider` field tells the UI which backend produced the result

### Pattern 5: SSE Streaming from FastAPI to React

```python
# backend/app/api/generation.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/stream")
async def generate_stream(request: GenerationRequest):
    async def event_generator():
        async for chunk in ai_service.generate_stream(
            model_key=request.model,
            prompt=request.prompt,
            system_prompt=request.system_prompt,
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

```typescript
// frontend/src/services/streaming.ts
export async function* streamGeneration(request: GenerationRequest): AsyncGenerator<string> {
  const response = await fetch('/api/generation/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.done) return;
        yield data.text;
      }
    }
  }
}
```

**Key Points:**
- FastAPI `StreamingResponse` with SSE format (`data: ...\n\n`)
- React consumes via `ReadableStream` reader
- JSON-encoded chunks allow metadata alongside text
- Terminal `done` event signals completion
- Dramatically improves perceived performance for content generation

### Pattern 6: React Page with Editor + Right Panel Layout

```tsx
// frontend/src/pages/EditorPage.tsx
export function EditorPage() {
  return (
    <div className="flex h-screen">
      {/* Main Editor - Single Column */}
      <div className="flex-1 overflow-y-auto p-6">
        <ContentEditor />
        <GenerationPanel />
        <SEOPanel />
      </div>
      {/* Validation Panel - Fixed Right */}
      <div className="w-96 border-l bg-gray-50 overflow-y-auto p-4">
        <ValidationPanel />
      </div>
    </div>
  );
}
```

**Key Points:**
- Flexbox layout with fixed-width right panel (per UX requirements)
- Editor takes remaining space (`flex-1`)
- Validation panel is always visible alongside editor
- Both panels independently scrollable

## Requirements

### Functional Requirements

1. **AI Content Generation (High Priority)**
   - Description: Connect to Anthropic Claude and OpenAI ChatGPT APIs to generate content drafts from user prompts. Support three content type templates: short-form video (1 min), long-form video (10 min), and SEO blog post. Stream AI responses in real-time to the editor.
   - Acceptance: User can select an AI model (Claude or ChatGPT), enter a prompt, and see the generated draft stream into the editor in under 5 seconds. Content type template structures the system prompt appropriately.

2. **Content Type Templates (High Priority)**
   - Description: Pre-configured templates that structure AI prompts and editor layouts for each content type. Short video templates target 150-200 words; long video templates target 1500-2000 words; blog post templates include SEO fields.
   - Acceptance: Each content type produces appropriately structured output with correct length targets and format (script format for videos, article format for blogs).

3. **Theological Validation via NotebookLM (High Priority)**
   - Description: One-click validation sends content to NotebookLM for doctrinal review against loaded Catholic sources. Returns a validation score (0-100%), flag list for issues, and source citations from the Catholic corpus (Catechism, Vatican II, etc.).
   - Acceptance: Validation completes in under 5 seconds (target; NotebookLM response times are unverified — see Performance Verification), displays score + flags + citations in the right panel. If NotebookLM is unavailable, falls back to AI-based validation with a clear indicator.

4. **Source Citation Display (High Priority)**
   - Description: Display traceable citations from NotebookLM validation, showing the specific text passages from Catholic sources that support or contradict the content.
   - Acceptance: Each citation shows the citation number, source name, and exact quoted text. Citations are expandable/collapsible. The user can see which parts of their content are supported by which sources.

5. **Content Lifecycle Status Tracking (Medium Priority)**
   - Description: Each content item moves through a linear status pipeline: draft → validated → scheduled → published. Status transitions are tracked with timestamps. Dashboard shows counts per status.
   - Acceptance: Status is visible on all content views (list, editor, calendar). Only valid transitions are allowed (e.g., cannot schedule without validation). Dashboard shows accurate pipeline counts.

6. **Editorial Calendar (Medium Priority)**
   - Description: Visual week/month calendar view showing scheduled content items. Click to schedule, reschedule, or view content details. Supports filtering by content type and channel.
   - Acceptance: Calendar displays all scheduled items on their publication dates. User can drag/click to schedule items. Week and month views both work. Items show content type icon, title, and channel.

7. **Portuguese SEO Metadata (Medium Priority)**
   - Description: For blog posts, provide fields for Portuguese meta title, meta description, keywords, and slug. Include automated readability assessment and AI-powered keyword suggestions in Portuguese.
   - Acceptance: SEO panel shows all metadata fields when editing a blog post. Readability score is calculated automatically. Keyword suggestions can be triggered via AI.

8. **Channel Management (Low Priority)**
   - Description: Tag content with delivery channels (YouTube, Blog, other). Each content item can be assigned to one or more channels. Channels appear on calendar and list views.
   - Acceptance: User can tag content with channels, filter by channel, and see channel assignments on calendar.

9. **iCal Export (Low Priority)**
   - Description: Export the editorial calendar as an .ics file compatible with Google Calendar, Apple Calendar, and Outlook.
   - Acceptance: Exported .ics file contains all scheduled items with correct dates, titles, and channel info. File imports successfully into Google Calendar.

10. **Content Versioning (Medium Priority)**
    - Description: Track version history for each content item. Each save after initial creation increments the version. Users can view previous versions and their associated validation results.
    - Acceptance: Version history is accessible from the editor. Each version shows a timestamp and can be viewed (read-only). Validation results are linked to the version they were run against.

### Edge Cases

1. **NotebookLM API Unavailable** — Fall back to AI-based validation (Claude/GPT with loaded Catholic source context). Display clear indicator that fallback provider was used, with lower confidence disclaimer.
2. **AI Generation Timeout** — If streaming doesn't start within 10 seconds, show timeout error with retry button. Partial streamed content is preserved in the editor.
3. **AI Generation API Key Missing** — Show setup instructions in the generation panel instead of the model selector. Do not expose which key is missing in the UI.
4. **Concurrent Validation + Generation** — Allow user to trigger validation while a generation is still streaming. Both operations should run independently.
5. **Empty Content Validation** — Prevent validation trigger when content body is empty. Show inline hint.
6. **Invalid Status Transition** — Prevent scheduling unvalidated content. Show toast notification explaining the required workflow step.
7. **Large Content Exceeding Token Limits** — For very long blog posts, chunk the content for validation. For generation, warn user if prompt + expected output exceeds model context window.
8. **NotebookLM Auth Token Expiry** — Handle token refresh automatically. If refresh fails, show re-authentication instructions.
9. **Calendar Date in the Past** — Allow scheduling in the past (for backdating published content) but show a warning.
10. **Portuguese Character Encoding** — Ensure UTF-8 encoding throughout the stack for proper Portuguese diacritical marks (ã, õ, ç, é, etc.).

## Implementation Notes

### DO
- Use `async def` for ALL FastAPI endpoints and service methods — the entire backend must be non-blocking
- Use Python `Protocol` classes for AI and validation provider interfaces — enables clean dependency injection and testing
- Reuse UI components from `prototypes-magic/src/components/ui/` — copy them into `frontend/src/components/ui/`
- Use `class-variance-authority` (CVA) for component variants — it's already in the prototype dependencies
- Use SQLModel's combined Pydantic+SQLAlchemy models — avoids duplicate model/schema definitions
- Implement streaming via SSE for all AI generation — dramatically improves UX
- Wrap ALL external API calls in try/except with specific error types (`anthropic.APIError`, OpenAI exceptions, `RPCError`)
- Use `python-dotenv` and Pydantic `BaseSettings` for configuration — validates env vars at startup
- Include `model` parameter in every Anthropic API call — there is no default model
- Create one client instance per provider and reuse — don't create per-request clients
- Default to Portuguese (`pt`) for all content and SEO operations
- Use UUID strings for all primary keys — enables offline-friendly ID generation

### DON'T
- Don't create a custom Catholic knowledge base or RAG pipeline — NotebookLM handles this
- Don't use the OpenAI Responses API — use Chat Completions API for stability
- Don't use synchronous database operations — always use `AsyncSession` with `aiosqlite`
- Don't expose API keys in frontend code — all AI calls go through the backend
- Don't use `@app.on_event("startup")` — use the `lifespan` context manager (deprecated in modern FastAPI)
- Don't hardcode AI model names — make them configurable via environment variables with sensible defaults
- Don't build multi-user auth — this is a single-user personal tool
- Don't use Playwright/Chromium in production for NotebookLM auth — use `NOTEBOOKLM_AUTH_JSON` env var with pre-captured tokens
- Don't block the event loop with `time.sleep()` or synchronous HTTP calls — use `asyncio.sleep()` and async clients

## Data Model

### Core Tables

```
content_items
├── id: UUID (PK)
├── title: str
├── body: text
├── content_type: enum (short_video | long_video | blog_post)
├── status: enum (draft | validated | scheduled | published)
├── language: str (default: "pt")
├── channels: JSON (list of strings, default: []) — e.g. ["youtube", "blog"]
├── ai_model_used: str (nullable) — "claude" or "chatgpt"
├── prompt_used: text (nullable) — the user's original prompt
├── scheduled_date: datetime (nullable)
├── published_date: datetime (nullable)
├── version: int (default: 1)
├── created_at: datetime
└── updated_at: datetime

content_versions
├── id: UUID (PK)
├── content_id: UUID (FK → content_items.id)
├── version_number: int
├── title: str
├── body: text
├── created_at: datetime
└── snapshot_reason: str — "manual_save", "pre_validation", "ai_generation"

validation_records
├── id: UUID (PK)
├── content_id: UUID (FK → content_items.id)
├── content_version: int — which version was validated
├── score: float (0.0 to 1.0)
├── flags: JSON (list of flag strings)
├── citations: JSON (list of citation objects)
├── provider: str — "notebooklm" or "ai_fallback"
├── raw_response: text
├── created_at: datetime
└── duration_ms: int — validation response time

seo_metadata
├── id: UUID (PK)
├── content_id: UUID (FK → content_items.id, unique)
├── meta_title: str
├── meta_description: text
├── keywords: JSON (list of strings)
├── slug: str
├── readability_score: float (nullable)
└── updated_at: datetime
```

### Relationships
- `content_items` 1:N `content_versions` — full version history
- `content_items` 1:N `validation_records` — multiple validations over time
- `content_items` 1:1 `seo_metadata` — one SEO record per content item (blog posts)

## Development Environment

### Prerequisites

```bash
# Python 3.11+ (FastAPI >= 0.130.0 and notebooklm-py require 3.10+; we target 3.11+ for best async performance)
python3 --version  # must be >= 3.11

# Node.js 18+ and npm
node --version
npm --version

# Playwright + Chromium (only for initial NotebookLM auth setup)
# NOT required in production if using NOTEBOOKLM_AUTH_JSON
```

### Install Dependencies

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# NotebookLM auth setup (one-time)
pip install 'notebooklm-py[browser]'
playwright install chromium
notebooklm login  # Opens browser for Google SSO
```

### Start Services

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Service URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- API Documentation (ReDoc): http://localhost:8000/redoc

### Required Environment Variables

Create `backend/.env`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...          # Anthropic Claude API key
OPENAI_API_KEY=sk-...                 # OpenAI API key

# NotebookLM (one of these)
NOTEBOOKLM_AUTH_JSON={"..."}          # Inline auth for production (preferred)
# OR rely on ~/.notebooklm/auth.json from 'notebooklm login'

# Optional
DATABASE_URL=sqlite+aiosqlite:///./verbum.db   # Default if not set
CLAUDE_MODEL=claude-sonnet-4-5-20250514            # Default Claude model
OPENAI_MODEL=gpt-4o-mini                        # Default OpenAI model
NOTEBOOKLM_NOTEBOOK_ID=                          # Pre-configured notebook with Catholic sources
LOG_LEVEL=INFO
```

## API Endpoints

### Content API (`/api/content`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List all content items (with filtering: status, type, channel) |
| `POST` | `/` | Create a new content item |
| `GET` | `/{id}` | Get a single content item |
| `PUT` | `/{id}` | Update a content item (body, title, status, channel) |
| `DELETE` | `/{id}` | Delete a content item |
| `GET` | `/{id}/versions` | Get version history for a content item |
| `GET` | `/{id}/versions/{version}` | Get a specific version snapshot |
| `POST` | `/{id}/status` | Transition content status (with validation) |

### Generation API (`/api/generation`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate` | Generate content (full response) |
| `POST` | `/stream` | Generate content with SSE streaming |
| `GET` | `/models` | List available AI models and their status |

### Validation API (`/api/validation`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/validate/{content_id}` | Trigger validation for a content item |
| `GET` | `/history/{content_id}` | Get validation history for a content item |
| `GET` | `/status` | Check validation service availability |

### Schedule API (`/api/schedule`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/calendar` | Get scheduled items for a date range |
| `POST` | `/{content_id}/schedule` | Schedule a content item |
| `PUT` | `/{content_id}/reschedule` | Reschedule a content item |
| `GET` | `/export/ical` | Export calendar as .ics file |

### Dashboard API (`/api/dashboard`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/summary` | Pipeline summary (counts per status, recent items) |
| `GET` | `/upcoming` | Next 7 days of scheduled content |

### SEO API (`/api/seo`)
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/{content_id}` | Get SEO metadata for a content item |
| `PUT` | `/{content_id}` | Update SEO metadata |
| `POST` | `/{content_id}/analyze` | Run readability analysis |
| `POST` | `/{content_id}/keywords` | Generate keyword suggestions via AI |

## Implementation Phases

### Phase 1: Foundation (Backend + Frontend Skeleton)
1. Set up project structure (backend and frontend directories)
2. Create FastAPI app with CORS, lifespan, and router structure
3. Define SQLModel data models and database initialization
4. Create React app with routing, Tailwind, and UI component library
5. Implement content CRUD (backend API + frontend list/create pages)
6. **Milestone**: Can create, list, edit, and delete content items

### Phase 2: AI Generation Integration
1. Implement Claude provider with streaming
2. Implement OpenAI provider with streaming
3. Create AI service abstraction layer
4. Build generation API endpoints (full + streaming)
5. Build frontend GenerationPanel with model selector and streaming display
6. Implement content type templates (system prompts per type)
7. **Milestone**: Can generate content via Claude or ChatGPT with real-time streaming

### Phase 3: Theological Validation
1. Implement NotebookLM provider with error handling and retry
2. Implement AI-based fallback validation provider
3. Create validation service with automatic failover
4. Build validation API endpoints
5. Build frontend ValidationPanel with score, flags, citations
6. Implement validation history tracking
7. **Milestone**: Can validate content with citation display and fallback

### Phase 4: Calendar, SEO, and Polish
1. Build editorial calendar UI (week/month views)
2. Implement scheduling API and status transitions
3. Add iCal export
4. Build SEO metadata panel for blog posts
5. Implement content versioning
6. Build dashboard with pipeline summary
7. Portuguese localization of interface elements
8. **Milestone**: Full content lifecycle operational

## Success Criteria

The task is complete when:

1. [ ] Project structure is set up with backend (FastAPI/Python) and frontend (React/TypeScript) directories
2. [ ] SQLite database is created with all required tables (content_items, content_versions, validation_records, seo_metadata)
3. [ ] Content CRUD operations work end-to-end (create, read, update, delete, list with filtering)
4. [ ] AI generation works with both Claude and ChatGPT, including real-time streaming to the editor
5. [ ] Content type templates (short video, long video, blog post) produce appropriately structured output
6. [ ] Theological validation via NotebookLM returns score, flags, and traceable citations
7. [ ] Validation fallback to AI-based provider works when NotebookLM is unavailable
8. [ ] Content status lifecycle (draft → validated → scheduled → published) is enforced and tracked
9. [ ] Editorial calendar displays scheduled items in week and month views
10. [ ] Portuguese SEO metadata tools work for blog posts (meta fields, readability, keyword suggestions)
11. [ ] Content versioning tracks edit history with version snapshots
12. [ ] iCal export produces valid .ics files
13. [ ] Dashboard shows pipeline summary with status counts and upcoming items
14. [ ] All API keys are managed via environment variables — none exposed in frontend
15. [ ] Frontend is Portuguese-first with consistent, responsive design
16. [ ] No console errors in normal operation
17. [ ] All existing tests pass, new tests cover core functionality

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| Content CRUD | `backend/tests/test_content.py` | Create, read, update, delete content items; validate field defaults; enforce required fields |
| Status Transitions | `backend/tests/test_content.py` | Valid transitions (draft→validated→scheduled→published); reject invalid transitions |
| Claude Provider | `backend/tests/test_generation.py` | Mock Anthropic client; verify correct model/params; handle APIError, RateLimitError |
| OpenAI Provider | `backend/tests/test_generation.py` | Mock OpenAI client; verify Chat Completions format; handle errors |
| Validation Service | `backend/tests/test_validation.py` | Primary→fallback failover; score/flag/citation parsing; unavailability detection |
| NotebookLM Provider | `backend/tests/test_validation.py` | Mock notebooklm client; parse AskResult with citations; handle RPCError |
| Schedule Service | `backend/tests/test_schedule.py` | Schedule/reschedule items; iCal export format; date range queries |
| SEO Service | `backend/tests/test_seo.py` | Readability score calculation; keyword suggestion format; metadata validation |
| Content Versioning | `backend/tests/test_content.py` | Version increment on save; snapshot creation; version retrieval |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| Content → Generation | backend API + AI service | POST to /api/generation/generate returns valid content; POST to /api/generation/stream returns SSE events |
| Content → Validation | backend API + validation service | POST to /api/validation/validate/{id} returns ValidationResult; GET /api/validation/history/{id} returns history |
| Content → Schedule | backend API + schedule service | POST schedule updates content status; GET /api/schedule/calendar returns items in date range |
| Validation Failover | validation service + providers | When primary provider raises, fallback is used; response includes `provider` field indicating fallback |
| Dashboard Aggregation | backend API + database | GET /api/dashboard/summary returns correct counts per status |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Content Creation | 1. Navigate to content list 2. Click "New Content" 3. Select "Short Video" type 4. Enter title | Content item created with status "draft", appears in list |
| AI Generation | 1. Open content in editor 2. Select "Claude" model 3. Enter prompt 4. Click "Generate" | Text streams into editor in real-time; content body is updated |
| Theological Validation | 1. Open content with body text 2. Click "Validate" | Validation panel shows score (0-100%), any flags, and expandable citations |
| Schedule Content | 1. Validate content first 2. Click "Schedule" 3. Select date and channel | Content appears on editorial calendar at selected date; status changes to "scheduled" |
| Full Pipeline | 1. Create → 2. Generate → 3. Validate → 4. Schedule → 5. Mark Published | Content item transitions through all statuses correctly; appears in dashboard counts |
| Validation Fallback | 1. Disable NotebookLM (env var) 2. Trigger validation | Validation completes via AI fallback; panel shows "fallback" indicator |

### Browser Verification

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Dashboard | `http://localhost:5173/` | Pipeline status counts display; upcoming items list populates; mini-calendar renders |
| Content List | `http://localhost:5173/content` | Content items load; filtering by status/type works; create button navigates to editor |
| Content Editor | `http://localhost:5173/content/{id}` | Editor loads content body; right panel shows validation results; generation panel has model selector |
| Generation Panel | `http://localhost:5173/content/{id}` | Model dropdown lists Claude + ChatGPT; streaming text appears character-by-character |
| Validation Panel | `http://localhost:5173/content/{id}` | Score displays as percentage with color coding; flags listed; citations expandable |
| Editorial Calendar | `http://localhost:5173/calendar` | Week/month toggle works; scheduled items appear on correct dates; click opens content |
| SEO Panel | `http://localhost:5173/content/{id}` (blog type) | SEO fields visible for blog posts only; readability score updates; keyword suggestions generate |

### Database Verification

| Check | Query/Command | Expected |
|-------|---------------|----------|
| Tables exist | `sqlite3 verbum.db ".tables"` | `content_items content_versions validation_records seo_metadata` |
| Content creation | `sqlite3 verbum.db "SELECT count(*) FROM content_items"` | Count increments after creating content |
| Status tracking | `sqlite3 verbum.db "SELECT status, count(*) FROM content_items GROUP BY status"` | Correct distribution across statuses |
| Validation records | `sqlite3 verbum.db "SELECT count(*) FROM validation_records WHERE content_id='{id}'"` | Records created after each validation |
| Version history | `sqlite3 verbum.db "SELECT count(*) FROM content_versions WHERE content_id='{id}'"` | Versions increment on saves |
| UTF-8 Portuguese | `sqlite3 verbum.db "SELECT title FROM content_items WHERE title LIKE '%ção%'"` | Portuguese characters stored and retrieved correctly |

### Security Verification

| Check | How to Verify | Expected |
|-------|---------------|----------|
| No API keys in frontend | Inspect network requests in browser DevTools | No `sk-ant-*` or `sk-*` keys in any request or response |
| API keys in env only | `grep -r "sk-ant\|sk-" frontend/` | No matches (keys only in backend/.env) |
| CORS configured | `curl -H "Origin: http://evil.com" http://localhost:8000/api/content` | Request blocked (only localhost:5173 allowed) |
| Environment validation | Remove ANTHROPIC_API_KEY from .env and restart backend | Clear error message at startup, not a runtime crash |

### Performance Verification

| Check | How to Verify | Target |
|-------|---------------|--------|
| AI generation latency | Time from "Generate" click to first streamed token | < 3 seconds |
| Validation latency | Time from "Validate" click to score display | < 5 seconds (NotebookLM), < 3 seconds (fallback) |
| Content list load | Navigate to content list with 50+ items | < 1 second page load |
| Calendar render | Navigate to calendar with 20+ scheduled items | < 1 second render |

### QA Sign-off Requirements
- [ ] All unit tests pass (`cd backend && pytest`)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete (all pages render correctly)
- [ ] Database state verified (tables, relationships, UTF-8)
- [ ] No regressions in existing functionality
- [ ] Code follows established patterns (async everywhere, Protocol interfaces, SQLModel)
- [ ] No security vulnerabilities introduced (API keys secure, CORS configured)
- [ ] Portuguese content renders correctly throughout
- [ ] Streaming AI generation works smoothly in the browser
- [ ] Validation fallback triggers correctly when NotebookLM is unavailable
- [ ] Editorial calendar displays items on correct dates
- [ ] Content status transitions are enforced (cannot skip validation)
