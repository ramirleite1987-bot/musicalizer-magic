import { describe, expect, it } from "vitest";
import {
  createSongInputSchema,
  mergeTrackStyle,
} from "@/lib/music/song-input";
import { buildSunoPrompt } from "@/lib/suno/client";

describe("Hermes song input", () => {
  it("trims text input and applies reliable defaults", () => {
    const input = createSongInputSchema.parse({
      trackName: "  Neon Demo  ",
      prompt: "  driving synth theme  ",
    });

    expect(input).toMatchObject({
      trackName: "Neon Demo",
      genre: "Electronic",
      prompt: "driving synth theme",
      negativePrompt: "",
      lyrics: "",
      notes: "",
      startGeneration: true,
      style: {},
    });
  });

  it("rejects unsupported style fields", () => {
    expect(() =>
      createSongInputSchema.parse({
        trackName: "Demo",
        prompt: "Make a concise hook",
        style: { unknown: "field" },
      })
    ).toThrow();
  });

  it("merges style overrides into the Suno prompt", () => {
    const style = mergeTrackStyle("Pop", {
      moods: ["bright", "urgent"],
      instruments: ["piano", "claps"],
      vocalStyle: "Female",
      tempo: 132,
      key: "A",
      isMinor: true,
      duration: "90s",
    });

    expect(
      buildSunoPrompt({
        prompt: "anthemic chorus",
        negativePrompt: "",
        lyrics: "",
        style,
      })
    ).toBe(
      "Pop. bright, urgent. featuring piano, claps. Female vocals. 132 BPM. Key of A minor. anthemic chorus"
    );
  });
});
