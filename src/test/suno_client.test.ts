import { describe, expect, it } from "vitest";
import { toSunoModelVersion } from "@/lib/suno/client";

describe("toSunoModelVersion", () => {
  it("maps friendly v5.5 to chirp-v5-5", () => {
    expect(toSunoModelVersion("v5.5")).toBe("chirp-v5-5");
  });

  it("maps v4 to chirp-v4", () => {
    expect(toSunoModelVersion("v4")).toBe("chirp-v4");
  });

  it("maps v3.5 to chirp-v3-5", () => {
    expect(toSunoModelVersion("v3.5")).toBe("chirp-v3-5");
  });

  it("passes through values already prefixed with chirp-", () => {
    expect(toSunoModelVersion("chirp-v3-0")).toBe("chirp-v3-0");
    expect(toSunoModelVersion("chirp-v4")).toBe("chirp-v4");
  });

  it("falls back to chirp-v4 when version is empty", () => {
    expect(toSunoModelVersion("")).toBe("chirp-v4");
  });
});
