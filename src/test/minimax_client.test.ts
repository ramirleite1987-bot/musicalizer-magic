import { describe, expect, it } from "vitest";
import { normalizeMinimaxStatus } from "@/lib/minimax/client";

describe("normalizeMinimaxStatus", () => {
  it("collapses success aliases to complete", () => {
    expect(normalizeMinimaxStatus("succeeded")).toBe("complete");
    expect(normalizeMinimaxStatus("success")).toBe("complete");
    expect(normalizeMinimaxStatus("complete")).toBe("complete");
    expect(normalizeMinimaxStatus("completed")).toBe("complete");
  });

  it("collapses failure aliases to failed", () => {
    expect(normalizeMinimaxStatus("failed")).toBe("failed");
    expect(normalizeMinimaxStatus("error")).toBe("failed");
  });

  it("collapses queued aliases to queued", () => {
    expect(normalizeMinimaxStatus("queued")).toBe("queued");
    expect(normalizeMinimaxStatus("pending")).toBe("queued");
  });

  it("treats unknown or undefined as processing", () => {
    expect(normalizeMinimaxStatus("running")).toBe("processing");
    expect(normalizeMinimaxStatus(undefined)).toBe("processing");
    expect(normalizeMinimaxStatus("")).toBe("processing");
  });
});
