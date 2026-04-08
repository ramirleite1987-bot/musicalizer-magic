# Specification: Musicalizer — AI Music Generation, Evaluation & Auto-Improvement Pipeline

## Overview

Musicalizer is a greenfield Python application that generates AI-powered song lyrics and prompts optimized for Suno AI, evaluates their quality, and iteratively improves them through an autonomous refinement loop inspired by Karpathy's AutoResearch pattern. The system supports dual LLM providers (Google Gemini API and Chutes API), configurable presets (shipping with Brazilian Catholic hymn presets out-of-the-box), and produces structured Suno-compatible output consisting of `style_prompt` and `lyrics_prompt` fields with proper structural tags.

## Workflow Type

**Type**: feature

**Rationale**: This is a complete greenfield application build — no existing code to refactor or migrate. Every component (provider abstraction, preset system, generation engine, evaluator, auto-improvement loop) must be designed and implemented from scratch.

## Task Scope

### Services Involved
- **musicalizer** (primary) — Single Python application encompassing all modules: providers, generation, evaluation, presets, and the auto-improvement loop.

### This Task Will:
- [ ] Create the full project structure with Python package layout
- [ ] Implement an LLM provider abstraction layer with Gemini and Chutes backends
- [ ] Build a preset system with a schema supporting language, style, genre, mood, tempo, and lyric themes
- [ ] Ship predefined Brazilian Catholic song presets as first-class named presets
- [ ] Implement a song generation engine producing Suno-optimized output (style_prompt + lyrics_prompt with structural tags)
- [ ] Build a structured evaluation module that scores generations as good/bad with rationale and improvement suggestions
- [ ] Implement the auto-improvement loop (Generate → Evaluate → Reflect → Regenerate) tracking generation lineage
- [ ] Create a CLI entry point for running generation, evaluation, and auto-improvement workflows
- [ ] Add comprehensive unit and integration tests

### Out of Scope:
- Web UI or REST API — this is a CLI/library-first build
- Actual Suno API integration (Suno has no API; output is text prompts for manual use)
- Audio file processing or playback
- User authentication or multi-tenancy
- Database persistence (file-based JSON history is sufficient for v1)

## Service Context

### Musicalizer (Python Application)

**Tech Stack:**
- Language: Python 3.11+
- Framework: None (standalone CLI application)
- Key libraries: `google-genai` (>=1.68.0), `openai` (for Chutes API), `pydantic` (data models & structured output), `click` (CLI), `pytest` (testing)
- Key directories: `src/musicalizer/` (source), `tests/` (tests), `presets/` (preset JSON files)

**Entry Point:** `src/musicalizer/cli.py`

**How to Run:**
```bash
# Install
pip install -e ".[dev]"

# Generate a song
python -m musicalizer generate --preset brazilian-catholic --provider gemini

# Evaluate a generation
python -m musicalizer evaluate --input output/generation_001.json

# Run auto-improvement loop
python -m musicalizer auto-improve --preset brazilian-catholic --provider gemini --iterations 5
```

**Port:** N/A (CLI application)

## Files to Create

### Project Root
| File | Purpose |
|------|---------|
| `pyproject.toml` | Project metadata, dependencies, entry points |
| `.env.example` | Template for required environment variables |
| `README.md` | Project documentation (minimal) |

### Source Package: `src/musicalizer/`
| File | Purpose |
|------|---------|
| `src/musicalizer/__init__.py` | Package init, version |
| `src/musicalizer/__main__.py` | Enable `python -m musicalizer` |
| `src/musicalizer/cli.py` | Click CLI with generate/evaluate/auto-improve commands |
| `src/musicalizer/config.py` | App configuration, env var loading, settings |
| `src/musicalizer/models.py` | Pydantic models: Preset, SunoOutput, EvalResult, GenerationRecord |
| `src/musicalizer/providers/__init__.py` | Provider package init |
| `src/musicalizer/providers/base.py` | Abstract `LLMProvider` interface |
| `src/musicalizer/providers/gemini.py` | `GeminiProvider` implementation |
| `src/musicalizer/providers/chutes.py` | `ChutesProvider` implementation |
| `src/musicalizer/providers/factory.py` | Provider factory function |
| `src/musicalizer/generator.py` | Song generation engine (orchestrates provider + preset → SunoOutput) |
| `src/musicalizer/evaluator.py` | Evaluation module (scores, rationale, improvements) |
| `src/musicalizer/improver.py` | Auto-improvement loop (generate → eval → reflect → regenerate) |
| `src/musicalizer/presets.py` | Preset loader and registry |
| `src/musicalizer/prompts.py` | Prompt templates for generation, evaluation, and reflection |
| `src/musicalizer/history.py` | Generation history tracker (JSON file-based) |

### Presets: `presets/`
| File | Purpose |
|------|---------|
| `presets/brazilian_catholic.json` | Brazilian Catholic hymn preset (first-class) |
| `presets/brazilian_catholic_christmas.json` | Brazilian Catholic Christmas variant |
| `presets/brazilian_catholic_marian.json` | Brazilian Catholic Marian hymn variant |

### Tests: `tests/`
| File | Purpose |
|------|---------|
| `tests/__init__.py` | Test package init |
| `tests/conftest.py` | Shared fixtures, mock providers |
| `tests/test_models.py` | Model validation tests |
| `tests/test_presets.py` | Preset loading and validation tests |
| `tests/test_providers.py` | Provider abstraction tests |
| `tests/test_generator.py` | Generation engine tests |
| `tests/test_evaluator.py` | Evaluation module tests |
| `tests/test_improver.py` | Auto-improvement loop tests |
| `tests/test_cli.py` | CLI command tests |

### Output: `output/`
| File | Purpose |
|------|---------|
| `output/.gitkeep` | Ensures output directory exists in repo |

## Patterns to Follow

### Pattern 1: LLM Provider Abstraction

Industry best practice — Strategy pattern with a common interface:

```python
from abc import ABC, abstractmethod
from musicalizer.models import SunoOutput

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str, response_schema: type[BaseModel] | None = None) -> str:
        """Generate a completion from the LLM."""
        ...

    @abstractmethod
    def get_model_name(self) -> str:
        """Return the model identifier."""
        ...
```

**Key Points:**
- All providers implement the same async `generate()` method
- Structured output (JSON schema) is passed as an optional parameter
- Provider selection happens via factory, not conditionals in business logic

### Pattern 2: Gemini Provider (google-genai)

```python
from google import genai
from google.genai import types

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    async def generate(self, system_prompt: str, user_prompt: str, response_schema: type[BaseModel] | None = None) -> str:
        config_kwargs: dict = {
            "system_instruction": system_prompt,
        }
        if response_schema is not None:
            config_kwargs["response_json_schema"] = response_schema.model_json_schema()
            config_kwargs["response_mime_type"] = "application/json"

        config = types.GenerateContentConfig(**config_kwargs)
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=config,
        )
        return response.text
```

**Key Points:**
- Use `google-genai` (NOT `google-generativeai` which is deprecated)
- Async via `client.aio.models.generate_content()`
- Structured output via `response_json_schema` config parameter
- Default model: `gemini-2.5-flash`

### Pattern 3: Chutes Provider (OpenAI-compatible)

```python
from openai import AsyncOpenAI

class ChutesProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "deepseek-ai/DeepSeek-R1"):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://llm.chutes.ai/v1/",
        )
        self.model = model

    async def generate(self, system_prompt: str, user_prompt: str, response_schema: type[BaseModel] | None = None) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        kwargs = {}
        if response_schema is not None:
            # Prefer json_schema type for full structured output; fall back to
            # json_object with schema instructions in the system prompt if the
            # provider does not support the full json_schema response_format.
            try:
                kwargs["response_format"] = {
                    "type": "json_schema",
                    "json_schema": {"name": "response", "schema": response_schema.model_json_schema()},
                }
            except Exception:
                kwargs["response_format"] = {"type": "json_object"}
                messages[0]["content"] += (
                    f"\n\nRespond with valid JSON matching this schema:\n"
                    f"{response_schema.model_json_schema()}"
                )
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs,
        )
        return response.choices[0].message.content
```

**Key Points:**
- Uses `openai` package with custom `base_url` — NOT the `chutes` PyPI package
- Model IDs use HuggingFace format (e.g., `deepseek-ai/DeepSeek-R1`)
- Env var: `CHUTES_API_KEY`
- **Structured output caveat:** Chutes' OpenAI-compatible API may not support the full `json_schema` response_format type. If it fails, fall back to `json_object` mode with schema instructions in the system prompt. The provider should catch API errors from the first attempt and retry with the fallback approach.

### Pattern 4: Pydantic Models for Structured Output

```python
from pydantic import BaseModel, Field
from enum import Enum

class Verdict(str, Enum):
    GOOD = "good"
    BAD = "bad"

class SunoOutput(BaseModel):
    """Suno-optimized song output."""
    style_prompt: str = Field(description="Suno style prompt: genre, instrumentation, mood")
    lyrics_prompt: str = Field(description="Suno lyrics with structural tags like [Verse], [Chorus]")
    title: str = Field(description="Song title")

class EvalResult(BaseModel):
    """Structured evaluation of a generation."""
    verdict: Verdict
    score: float = Field(ge=0.0, le=1.0, description="Quality score 0-1")
    rationale: str = Field(description="Why this verdict was given")
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(description="Specific actionable improvements")

class Preset(BaseModel):
    """Generation preset configuration."""
    name: str = Field(description="Preset identifier (e.g., 'brazilian-catholic')")
    description: str = Field(description="Human-readable preset description")
    language: str = Field(description="Target language code (e.g., 'pt-BR')")
    style: str = Field(description="Full style_prompt text for Suno")
    genre: str = Field(description="Primary genre (e.g., 'Catholic hymn')")
    mood: str = Field(description="Emotional mood (e.g., 'devotional')")
    tempo: str = Field(default="moderate", description="Tempo feel")
    lyric_themes: list[str] = Field(default_factory=list, description="Thematic keywords for lyrics generation")
    structural_tags: list[str] = Field(
        default_factory=lambda: ["[Verse]", "[Chorus]", "[Bridge]", "[Outro]"],
        description="Suno structural tags to use in lyrics_prompt"
    )

class GenerationRecord(BaseModel):
    """Record of a single generation iteration in the auto-improvement loop."""
    iteration: int = Field(description="Iteration number (1-based)")
    output: SunoOutput = Field(description="Generated song output")
    evaluation: EvalResult | None = Field(default=None, description="Evaluation result")
    parent_iteration: int | None = Field(default=None, description="Parent iteration for lineage tracking")
    timestamp: str = Field(description="ISO timestamp of generation")
```

**Key Points:**
- All data models use Pydantic for validation AND structured LLM output
- `EvalResult` must be machine-parseable to feed the auto-improvement loop
- `SunoOutput` mirrors Suno's two-field model exactly
- `Preset` defines the full schema for preset JSON files
- `GenerationRecord` tracks each iteration in the auto-improvement loop with full lineage

### Pattern 5: Auto-Improvement Loop (Karpathy AutoResearch Pattern)

```python
import logging

logger = logging.getLogger(__name__)

async def auto_improve(
    provider: LLMProvider,
    preset: Preset,
    max_iterations: int = 5,
    target_score: float = 0.8,
    plateau_limit: int = 3,
) -> list[GenerationRecord]:
    history: list[GenerationRecord] = []
    best_score: float = 0.0
    best_iteration: int = 0
    no_improvement_count: int = 0

    for i in range(max_iterations):
        # 1. Generate (using prior eval feedback if available)
        prior_feedback = history[-1].evaluation if history else None
        output = await generate_song(provider, preset, prior_feedback)

        # 2. Evaluate
        evaluation = await evaluate_song(provider, output, preset)

        # 3. Record
        record = GenerationRecord(
            iteration=i + 1,
            output=output,
            evaluation=evaluation,
            parent_iteration=i if i > 0 else None,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        history.append(record)

        # 4. Track best and detect plateau
        if evaluation.score > best_score:
            best_score = evaluation.score
            best_iteration = i + 1
            no_improvement_count = 0
        else:
            no_improvement_count += 1

        # 5. Check convergence — target score met
        if evaluation.score >= target_score:
            logger.info(f"Target score {target_score} reached at iteration {i + 1}")
            break

        # 6. Check plateau — no improvement for N consecutive iterations
        if no_improvement_count >= plateau_limit:
            logger.warning(
                f"No improvement for {plateau_limit} consecutive iterations. "
                f"Best score: {best_score} at iteration {best_iteration}. Stopping early."
            )
            break

    return history
```

**Key Points:**
- Each iteration feeds the previous evaluation's `improvements` list into the next generation prompt
- Track full lineage (parent_iteration) for quality delta analysis
- Stop early when target score is met
- **Plateau detection:** Stop after N consecutive iterations with no score improvement (avoids wasting API calls)
- **Best tracking:** Track the best score and iteration for reporting
- History is returned and persisted for review

### Pattern 6: Preset JSON Format

Each preset is a JSON file in `presets/` matching the `Preset` model schema:

```json
{
  "name": "brazilian-catholic",
  "description": "Traditional Brazilian Catholic hymn with MPB influence",
  "language": "pt-BR",
  "style": "Brazilian Catholic hymn, MPB influence, warm acoustic guitar, gentle piano, congregational choir, devotional mood, Portuguese lyrics, reverent and uplifting",
  "genre": "Catholic hymn",
  "mood": "devotional",
  "tempo": "moderate",
  "lyric_themes": ["faith", "grace", "devotion", "praise", "congregation", "God's love"],
  "structural_tags": ["[Verse]", "[Chorus]", "[Bridge]", "[Outro]"]
}
```

**Key Points:**
- Preset `name` uses **hyphens** (e.g., `brazilian-catholic`) for CLI usage; file names use **underscores** (e.g., `brazilian_catholic.json`). The preset loader must map between these conventions.
- The `style` field maps directly to Suno's `style_prompt` — it should describe sound, NOT contain lyrics.
- `structural_tags` defines which Suno tags to use in generated `lyrics_prompt`.
- **Preset resolution:** The `presets.py` loader should search for presets in: (1) the `presets/` directory relative to the project root, and (2) as a fallback, bundled presets via `importlib.resources` if the package includes them. For v1, assuming execution from the project root is acceptable.

### Pattern 7: Suno-Optimized Prompt Format

Suno V4.5 uses a **two-field model**:

**style_prompt** — Sound description (NO lyrics here):
```
Brazilian Catholic hymn, MPB influence, warm acoustic guitar, gentle piano,
congregational choir, devotional mood, Portuguese lyrics
```

**lyrics_prompt** — Words + structural tags ONLY:
```
[Verse]
Senhor, eu venho a Ti
Com o coração aberto
Tua graça me sustém
No caminho que é certo

[Chorus]
Glória a Deus nas alturas
Paz na terra aos seus amados
Com amor nos envolveu
Somos seus abençoados

[Bridge]
Na Tua presença encontro paz
A Tua palavra é verdade
```

**Key structural tags:** `[Verse]`, `[Chorus]`, `[Bridge]`, `[Drop]`, `[Outro]`, `[Fade Out]`
**Avoid:** `[Intro]` tag (unreliable in Suno) — describe intro in style_prompt instead.

## Requirements

### Functional Requirements

1. **Multi-Provider LLM Generation**
   - Description: Support both Google Gemini API and Chutes API through a unified provider abstraction. Users select provider via CLI flag or config.
   - Acceptance: Running `python -m musicalizer generate --provider gemini` and `--provider chutes` both produce valid SunoOutput JSON.

2. **Suno-Optimized Output**
   - Description: All generated output conforms to Suno's two-field format: `style_prompt` (genre/mood/instrumentation text) + `lyrics_prompt` (lyrics with structural tags `[Verse]`, `[Chorus]`, `[Bridge]`, etc.).
   - Acceptance: Generated output contains valid `style_prompt` and `lyrics_prompt` fields. `lyrics_prompt` contains at least `[Verse]` and `[Chorus]` tags. No `[Intro]` tag in lyrics_prompt.

3. **Preset System with Brazilian Catholic Defaults**
   - Description: Load generation presets from JSON files. Ship with predefined Brazilian Catholic hymn presets covering standard hymns, Christmas, and Marian variants. Presets define language, style, genre, mood, tempo, and lyric themes.
   - Acceptance: `python -m musicalizer generate --preset brazilian-catholic` works out-of-the-box without any user configuration. At least 3 Brazilian Catholic preset variants are available.

4. **Structured Evaluation**
   - Description: Evaluate any generated song output and produce a structured `EvalResult` with verdict (good/bad), numeric score (0-1), rationale, strengths, weaknesses, and actionable improvements list.
   - Acceptance: `python -m musicalizer evaluate --input <file>` produces parseable JSON output matching the `EvalResult` schema. The `improvements` field contains specific, actionable suggestions.

5. **Auto-Improvement Loop**
   - Description: Implement the Karpathy AutoResearch-inspired iterative refinement cycle: Generate → Evaluate → Reflect (use eval feedback to improve prompt) → Regenerate. Each iteration uses the prior evaluation's improvements as context. Tracks full generation lineage.
   - Acceptance: `python -m musicalizer auto-improve --iterations 5` produces a history of N generations where later generations demonstrably incorporate feedback from earlier evaluations. Score trend is visible in output.

6. **Generation History**
   - Description: Persist generation history as JSON files in the `output/` directory. Each run creates a timestamped file with all iterations, scores, and lineage.
   - Acceptance: After an auto-improve run, `output/` contains a JSON file with the full generation history including all iterations and their evaluation results.

7. **Configuration Management**
   - Description: Load API keys from environment variables (`GEMINI_API_KEY`, `CHUTES_API_KEY`). Support `.env` file loading. Validate configuration before execution.
   - Acceptance: Clear error message when required API key is missing. `.env` file is loaded automatically if present.

### Edge Cases

1. **Missing API Key** — Raise a clear `ConfigurationError` with instructions on which env var to set, before any API call is attempted.
2. **API Rate Limiting / Timeout** — Implement retry with exponential backoff (3 attempts, 1s/2s/4s). Log each retry.
3. **Malformed LLM Response** — If structured output parsing fails, retry once with a stricter prompt. If still invalid, log the raw response and raise a `GenerationError`.
4. **Empty Lyrics** — If `lyrics_prompt` is empty or contains no structural tags, flag as invalid in evaluation and request regeneration.
5. **Auto-Improve No Convergence** — If score does not improve after 3 consecutive iterations, log a warning and stop early to avoid wasting API calls.
6. **Preset File Not Found** — List available presets in the error message.
7. **Provider Unavailable** — If the selected provider's API is unreachable, fail fast with a clear error rather than hanging.

## Implementation Notes

### DO
- Use `async/await` throughout for all LLM calls — both providers support async
- Use `asyncio.run()` in Click CLI commands to bridge sync CLI entry points to async business logic (Click does not natively support async commands)
- Use `google-genai` (NOT `google-generativeai` which is deprecated since Nov 2025)
- Use `openai` package with `base_url` for Chutes (NOT the `chutes` PyPI package)
- Use Pydantic `BaseModel` for ALL data structures — enables structured LLM output AND validation
- Use `click` for the CLI — it's the Python standard for CLI apps
- Use `python-dotenv` for `.env` file loading
- Follow the two-field Suno prompt model strictly (`style_prompt` + `lyrics_prompt`)
- Track generation lineage with `parent_iteration` references
- Include `google-genai[aiohttp]` extra for async Gemini support
- Use `gemini-2.5-flash` as default Gemini model
- Use `deepseek-ai/DeepSeek-R1` as default Chutes model

### DON'T
- Don't use `google-generativeai` — it's deprecated
- Don't use the `chutes` PyPI package — it's for deployment, not inference
- Don't use `[Intro]` tag in lyrics_prompt — it's unreliable in Suno
- Don't mix lyrics into `style_prompt` or style descriptions into `lyrics_prompt`
- Don't use synchronous API calls — use async for both providers
- Don't store API keys in code or config files — environment variables only
- Don't make evaluation output free-text — it must be structured/parseable for the auto-loop
- Don't use `generate_content(stream=True)` for Gemini — use `generate_content_stream()` if streaming is needed

## Development Environment

### Setup

```bash
# Clone and enter project
cd /home/rlmit/workspace/musicalizer

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install in development mode
pip install -e ".[dev]"

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Required Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (required for Gemini provider)
- `CHUTES_API_KEY`: Chutes API key (required for Chutes provider)

### Run Commands

```bash
# Generate a song
python -m musicalizer generate --preset brazilian-catholic --provider gemini

# Generate with language override
python -m musicalizer generate --preset brazilian-catholic --provider gemini --language pt-BR

# Evaluate output
python -m musicalizer evaluate --input output/generation_001.json

# Run auto-improvement loop
python -m musicalizer auto-improve --preset brazilian-catholic --provider gemini --iterations 5 --target-score 0.8

# List available presets
python -m musicalizer presets list

# Run tests
pytest tests/ -v
```

### Service URLs
- N/A (CLI application — no web server)

## Project Structure

```
musicalizer/
├── pyproject.toml
├── .env.example
├── .gitignore
├── README.md
├── presets/
│   ├── brazilian_catholic.json
│   ├── brazilian_catholic_christmas.json
│   └── brazilian_catholic_marian.json
├── src/
│   └── musicalizer/
│       ├── __init__.py
│       ├── __main__.py
│       ├── cli.py
│       ├── config.py
│       ├── models.py
│       ├── providers/
│       │   ├── __init__.py
│       │   ├── base.py
│       │   ├── gemini.py
│       │   ├── chutes.py
│       │   └── factory.py
│       ├── generator.py
│       ├── evaluator.py
│       ├── improver.py
│       ├── presets.py
│       ├── prompts.py
│       └── history.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_models.py
│   ├── test_presets.py
│   ├── test_providers.py
│   ├── test_generator.py
│   ├── test_evaluator.py
│   ├── test_improver.py
│   └── test_cli.py
└── output/
    └── .gitkeep
```

## Dependencies

### Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| `google-genai[aiohttp]` | >=1.68.0 | Google Gemini API client (async) |
| `openai` | >=1.0.0 | Chutes API client (OpenAI-compatible) |
| `pydantic` | >=2.0.0 | Data models, validation, structured LLM output schemas |
| `click` | >=8.0.0 | CLI framework |
| `python-dotenv` | >=1.0.0 | .env file loading |
| `rich` | >=13.0.0 | Terminal output formatting, progress bars, tables |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | >=7.0.0 | Test runner |
| `pytest-asyncio` | >=0.21.0 | Async test support |
| `pytest-mock` | >=3.0.0 | Mocking utilities |

## Success Criteria

The task is complete when:

1. [ ] `pip install -e ".[dev]"` installs cleanly with all dependencies
2. [ ] `python -m musicalizer generate --preset brazilian-catholic --provider gemini` produces valid Suno-formatted output (requires valid API key)
3. [ ] `python -m musicalizer generate --preset brazilian-catholic --provider chutes` produces valid Suno-formatted output (requires valid API key)
4. [ ] `python -m musicalizer evaluate --input <file>` produces structured EvalResult JSON
5. [ ] `python -m musicalizer auto-improve --preset brazilian-catholic --iterations 3` runs the full generate→evaluate→improve loop and outputs generation history with scores
6. [ ] `python -m musicalizer presets list` shows all available presets including 3 Brazilian Catholic variants
7. [ ] All Brazilian Catholic presets are predefined and work out-of-the-box
8. [ ] Generated `lyrics_prompt` contains Suno structural tags (`[Verse]`, `[Chorus]`) and no `[Intro]` tag
9. [ ] Generated `style_prompt` does not contain lyrics text
10. [ ] Generation history is persisted to `output/` as JSON
11. [ ] All unit tests pass: `pytest tests/ -v`
12. [ ] Clear error messages for missing API keys, invalid presets, API failures
13. [ ] No hardcoded API keys in source code

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Model Validation | `tests/test_models.py` | SunoOutput, EvalResult, Preset, GenerationRecord all validate correctly; invalid data is rejected |
| Preset Loading | `tests/test_presets.py` | All preset JSON files load and validate; missing preset raises clear error; list presets works |
| Provider Interface | `tests/test_providers.py` | Both GeminiProvider and ChutesProvider implement LLMProvider interface; factory returns correct provider |
| Generator | `tests/test_generator.py` | Generation produces valid SunoOutput; preset config is applied; prior feedback is incorporated |
| Evaluator | `tests/test_evaluator.py` | Evaluation produces valid EvalResult; verdict is good/bad enum; improvements list is non-empty for bad scores |
| Improver | `tests/test_improver.py` | Loop runs N iterations; stops early on target score; stops on no-improvement plateau; history tracks lineage |
| CLI Commands | `tests/test_cli.py` | All CLI commands (generate, evaluate, auto-improve, presets list) execute without errors using mocked providers |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Generate + Evaluate Pipeline | Generator ↔ Evaluator | Generated SunoOutput can be passed directly to evaluator and produces valid EvalResult |
| Auto-Improve Full Loop | Generator ↔ Evaluator ↔ Improver | Full loop executes with mocked LLM responses; each iteration incorporates prior feedback |
| Preset → Generation | Presets ↔ Generator | Each Brazilian Catholic preset produces correctly themed output with Portuguese lyrics |
| History Persistence | Improver ↔ History | Auto-improve run persists complete history to output/ directory as valid JSON |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Single Generation | 1. Load preset 2. Initialize provider 3. Generate | Valid SunoOutput JSON with style_prompt and lyrics_prompt containing structural tags |
| Evaluate Generation | 1. Load a generation file 2. Run evaluation | Valid EvalResult with verdict, score, rationale, and improvements |
| Auto-Improvement | 1. Select preset 2. Run auto-improve with 3 iterations | History JSON with 3 entries; each entry has output + evaluation; later entries reference prior feedback |
| Preset Listing | 1. Run `presets list` | At least 3 presets shown: brazilian-catholic, brazilian-catholic-christmas, brazilian-catholic-marian |
| Missing API Key | 1. Unset GEMINI_API_KEY 2. Run generate --provider gemini | Clear ConfigurationError mentioning GEMINI_API_KEY |

### CLI Verification
| Command | Expected Behavior |
|---------|------------------|
| `python -m musicalizer --help` | Shows available commands: generate, evaluate, auto-improve, presets |
| `python -m musicalizer generate --help` | Shows options: --preset, --provider, --language, --output |
| `python -m musicalizer presets list` | Lists all preset names with descriptions |
| `python -m musicalizer generate --preset nonexistent` | Error listing available presets |

### QA Sign-off Requirements
- [ ] All unit tests pass (`pytest tests/ -v`)
- [ ] All integration tests pass
- [ ] All E2E tests pass (with mocked providers for CI, real providers for manual verification)
- [ ] CLI help text is accurate and complete
- [ ] Brazilian Catholic presets produce thematically appropriate output
- [ ] Generated output follows Suno V4.5 two-field format strictly
- [ ] Evaluation output is structured, parseable JSON matching EvalResult schema
- [ ] Auto-improvement loop correctly passes evaluation feedback to next generation
- [ ] Generation history is persisted and readable
- [ ] No API keys in source code or committed files
- [ ] Error messages are clear and actionable
- [ ] No regressions — all tests green
- [ ] Code follows established patterns (async/await, Pydantic models, provider abstraction)
