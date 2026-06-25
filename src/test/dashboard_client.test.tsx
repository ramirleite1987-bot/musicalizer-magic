import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { I18nProvider } from "@/i18n/provider";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/app/actions/versions", () => ({
  updateVersion: vi.fn(),
  cloneVersion: vi.fn(),
  markBest: vi.fn(),
}));

vi.mock("@/app/actions/generation", () => ({
  startGeneration: vi.fn(),
}));

vi.mock("@/app/actions/themes", () => ({
  createTheme: vi.fn(),
  deleteTheme: vi.fn(),
  assignTheme: vi.fn(),
  removeTheme: vi.fn(),
}));

describe("DashboardClient", () => {
  it("renders empty state when no tracks exist", () => {
    render(
      <I18nProvider initialLocale="en">
        <DashboardClient initialTracks={[]} initialThemes={[]} />
      </I18nProvider>
    );
    expect(
      screen.getByText("Select a track to get started")
    ).toBeInTheDocument();
  });
});

