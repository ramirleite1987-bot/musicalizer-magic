import type { TrackVersion } from "@/types/music";

export interface StylePromptAppSource {
  trackName: string;
  trackGenre: string;
  version: TrackVersion;
}

export interface ExternalStyleReference {
  title?: string;
  artist?: string;
  url?: string;
  notes?: string;
  lyrics?: string;
}

export interface StylePromptExtractionInput {
  appSources?: StylePromptAppSource[];
  externalSources?: ExternalStyleReference[];
  maxPromptLength?: number;
}

export interface StylePromptExtractionResult {
  prompt: string;
  negativePrompt: string;
  sourceCount: number;
}

const DEFAULT_MAX_PROMPT_LENGTH = 2800;

export function buildStylePromptExtraction({
  appSources = [],
  externalSources = [],
  maxPromptLength = DEFAULT_MAX_PROMPT_LENGTH,
}: StylePromptExtractionInput): StylePromptExtractionResult {
  const usableExternalSources = externalSources.filter(hasExternalReference);
  const sourceCount = appSources.length + usableExternalSources.length;

  if (sourceCount === 0) {
    return {
      prompt: "",
      negativePrompt: "",
      sourceCount,
    };
  }

  const genres = uniqueValues(
    appSources.flatMap(({ trackGenre, version }) => [
      version.style.genre,
      trackGenre,
    ])
  );
  const moods = uniqueValues(
    appSources.flatMap(({ version }) => version.style.moods)
  );
  const instruments = uniqueValues(
    appSources.flatMap(({ version }) => version.style.instruments)
  );
  const vocalStyles = uniqueValues(
    appSources
      .map(({ version }) => version.style.vocalStyle)
      .filter((style) => style && style !== "None")
  );
  const tempos = uniqueValues(
    appSources.map(({ version }) => `${version.style.tempo} BPM`)
  );
  const keys = uniqueValues(
    appSources.map(
      ({ version }) =>
        `Key of ${version.style.key}${version.style.isMinor ? " minor" : " major"}`
    )
  );

  const appReferenceCues = appSources
    .map(({ trackName, version }) =>
      cleanText(
        `${trackName} v${version.versionNumber}: ${[
          version.prompt,
          version.notes,
          version.feedback.musicPositives,
          version.lyrics ? `lyric cue ${version.lyrics}` : "",
        ]
          .map(cleanText)
          .filter(Boolean)
          .join("; ")}`
      )
    )
    .filter(Boolean);

  const externalReferenceCues = usableExternalSources.map((source, index) =>
    buildExternalReferenceCue(source, index)
  );

  const promptSections = [
    sentence("Suno style prompt", [
      phrase("Blend", genres),
      phrase("moods", moods),
      phrase("feature", instruments),
      phrase("vocal direction", vocalStyles),
      phrase("tempo target", tempos),
      phrase("harmonic center", keys),
    ]),
    section("Reference cues", [...appReferenceCues, ...externalReferenceCues]),
    "Keep the result cohesive, song-ready, and concise for Suno.",
  ];

  const negativePrompt = uniqueValues(
    appSources.flatMap(({ version }) => [
      version.negativePrompt,
      version.feedback.musicNegatives,
      version.feedback.lyricsNegatives,
      version.feedback.thingsToAvoid,
    ])
  ).join(". ");

  return {
    prompt: truncate(cleanText(promptSections.filter(Boolean).join(" ")), maxPromptLength),
    negativePrompt,
    sourceCount,
  };
}

function buildExternalReferenceCue(
  source: ExternalStyleReference,
  index: number
) {
  const label = cleanText(
    [source.title, source.artist ? `by ${source.artist}` : ""]
      .filter(Boolean)
      .join(" ")
  ) || `External reference ${index + 1}`;
  const details = [source.notes, source.lyrics ? `lyric cue ${source.lyrics}` : ""]
    .map(cleanText)
    .filter(Boolean)
    .join("; ");
  const link = source.url
    ? `External reference link included: ${cleanText(source.url)}`
    : "";

  return [label, details, link].filter(Boolean).join(" - ");
}

function hasExternalReference(source: ExternalStyleReference) {
  return Boolean(
    cleanText(source.title) ||
      cleanText(source.artist) ||
      cleanText(source.url) ||
      cleanText(source.notes) ||
      cleanText(source.lyrics)
  );
}

function section(label: string, values: string[]) {
  if (values.length === 0) return "";
  return `${label}: ${values.join(" | ")}.`;
}

function phrase(label: string, values: string[]) {
  if (values.length === 0) return "";
  return `${label} ${values.join(", ")}`;
}

function sentence(label: string, values: string[]) {
  const body = values.filter(Boolean).join("; ");
  return body ? `${label}: ${body}.` : "";
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
