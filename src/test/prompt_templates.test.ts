import { describe, expect, it } from "vitest";
import {
  PROMPT_TEMPLATES,
  TEMPLATE_CATEGORIES,
} from "@/data/prompt-templates";

describe("prompt templates", () => {
  it("lists Católico as the featured (first) category", () => {
    expect(TEMPLATE_CATEGORIES[0]).toBe("Católico");
  });

  it("has every template's category registered in TEMPLATE_CATEGORIES", () => {
    for (const t of PROMPT_TEMPLATES) {
      expect(TEMPLATE_CATEGORIES).toContain(t.category);
    }
  });

  it("uses unique template ids", () => {
    const ids = PROMPT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has well-formed core fields on every template", () => {
    for (const t of PROMPT_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.description.trim().length).toBeGreaterThan(0);
      expect(t.prompt.trim().length).toBeGreaterThan(0);
      expect(typeof t.negativePrompt).toBe("string");
      expect(t.style.genre).toBeTruthy();
    }
  });

  describe("Católico templates", () => {
    const catholic = PROMPT_TEMPLATES.filter((t) => t.category === "Católico");

    it("ships a meaningful set of Catholic styles", () => {
      expect(catholic.length).toBeGreaterThanOrEqual(6);
    });

    it("provides structured starter lyrics with section tags", () => {
      for (const t of catholic) {
        expect(t.lyrics, `${t.id} should have lyrics`).toBeTruthy();
        // Suno-style section tags are used; [Intro] is intentionally avoided.
        expect(t.lyrics).toMatch(/\[(Verse|Chorus|Bridge)\]/);
        expect(t.lyrics).not.toMatch(/\[Intro\]/);
      }
    });
  });
});
