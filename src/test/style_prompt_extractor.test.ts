import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StylePromptExtractorTab } from "@/components/style-prompt-extractor-tab";
import {
  buildStylePromptExtraction,
  type ExternalStyleReference,
  type StylePromptAppSource,
} from "@/lib/music/style-prompt-extractor";
import type { Track, TrackVersion } from "@/types/music";

function makeVersion(
  overrides: Partial<TrackVersion> = {}
): TrackVersion {
  return {
    id: "version-1",
    trackId: "track-1",
    versionNumber: 1,
    createdAt: "2026-05-11T00:00:00.000Z",
    status: "draft",
    prompt: "Driving synth bass with a soaring chorus",
    negativePrompt: "Avoid muddy low end",
    lyrics: "[Chorus]\nWe rise through neon rain",
    style: {
      genre: "Synthwave",
      moods: ["energetic", "nostalgic"],
      tempo: 128,
      key: "A",
      isMinor: true,
      instruments: ["synth bass", "gated drums"],
      vocalStyle: "Female Vocals",
      duration: "2m",
      sunoApiVersion: "v4",
    },
    rating: 4,
    dimensionScores: {
      melody: 8,
      harmony: 7,
      rhythm: 9,
      production: 8,
      lyricsFit: 7,
      originality: 6,
      emotionalImpact: 8,
    },
    notes: "Needs a brighter bridge",
    feedback: {
      musicPositives: "Strong pulse and cinematic lift",
      musicNegatives: "Kick could be cleaner",
      lyricsPositives: "Memorable hook",
      lyricsNegatives: "",
      thingsToAvoid: "No generic EDM drop",
    },
    isBest: false,
    audioFileName: null,
    audioUrl: null,
    sunoTaskId: null,
    ...overrides,
  };
}

describe("style prompt extractor", () => {
  it("combines app versions into a concise Suno style prompt", () => {
    const appSources: StylePromptAppSource[] = [
      {
        trackName: "Neon Pilgrim",
        trackGenre: "Electronic",
        version: makeVersion(),
      },
      {
        trackName: "Neon Pilgrim",
        trackGenre: "Electronic",
        version: makeVersion({
          id: "version-2",
          versionNumber: 2,
          prompt: "Add arpeggiated keys and a wider final chorus",
          style: {
            ...makeVersion().style,
            moods: ["nostalgic", "urgent"],
            instruments: ["synth bass", "arpeggiated keys"],
          },
        }),
      },
    ];

    const result = buildStylePromptExtraction({ appSources });

    expect(result.prompt).toContain("Synthwave");
    expect(result.prompt).toContain("energetic, nostalgic, urgent");
    expect(result.prompt).toContain("synth bass, gated drums, arpeggiated keys");
    expect(result.prompt).toContain("128 BPM");
    expect(result.prompt).toContain("Key of A minor");
    expect(result.prompt).toContain("Neon Pilgrim v1");
    expect(result.prompt).toContain("Neon Pilgrim v2");
    expect(result.negativePrompt).toContain("Avoid muddy low end");
    expect(result.negativePrompt).toContain("No generic EDM drop");
    expect(result.sourceCount).toBe(2);
  });

  it("uses external references without fetching external URLs", () => {
    const externalSources: ExternalStyleReference[] = [
      {
        title: "Ocean Ave",
        artist: "Night Harbor",
        url: "https://example.com/song",
        notes:
          "Shimmering indie guitars, intimate male vocal, warm tape saturation",
      },
    ];

    const result = buildStylePromptExtraction({ externalSources });

    expect(result.prompt).toContain("Ocean Ave by Night Harbor");
    expect(result.prompt).toContain(
      "Shimmering indie guitars, intimate male vocal, warm tape saturation"
    );
    expect(result.prompt).toContain("External reference link included");
    expect(result.sourceCount).toBe(1);
  });

  it("renders the extractor tab with app and external references", async () => {
    const user = userEvent.setup();
    const version = makeVersion();
    const track: Track = {
      id: "track-1",
      name: "Neon Pilgrim",
      genre: "Electronic",
      themeIds: [],
      versions: [version],
      createdAt: "2026-05-11T00:00:00.000Z",
      updatedAt: "2026-05-11T00:00:00.000Z",
    };

    render(
      createElement(StylePromptExtractorTab, {
        track,
        selectedVersion: version,
        onChange: vi.fn(),
      })
    );

    const promptOutput = screen.getByPlaceholderText(
      "Select app versions or add external reference details."
    ) as HTMLTextAreaElement;

    expect(screen.getByText("Suno style prompt")).toBeInTheDocument();
    expect(promptOutput.value).toContain("Neon Pilgrim v1");

    await user.type(screen.getByLabelText("Title"), "Ocean Ave");
    await user.type(screen.getByLabelText("Style notes"), "jangly guitars");

    expect(promptOutput.value).toContain("Ocean Ave");
    expect(promptOutput.value).toContain("jangly guitars");
  });
});
