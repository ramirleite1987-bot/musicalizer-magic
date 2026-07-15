import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateTrackDialog } from "@/components/create-track-dialog";
import { I18nProvider } from "@/i18n/provider";
import { DEFAULT_LOCALE } from "@/i18n/config";

vi.mock("@/app/actions/tracks", () => ({ createTrack: vi.fn() }));

describe("CreateTrackDialog", () => {
  it("surfaces Catholic templates (featured) plus a blank option when open", () => {
    render(
      <I18nProvider initialLocale={DEFAULT_LOCALE}>
        <CreateTrackDialog open onOpenChange={() => {}} />
      </I18nProvider>
    );

    // Catholic category is featured in the picker.
    expect(
      screen.getByRole("heading", { name: "Católico" })
    ).toBeInTheDocument();
    expect(screen.getByText("em destaque")).toBeInTheDocument();

    // A representative spread of Catholic templates is offered.
    expect(screen.getByText("Louvor & Adoração")).toBeInTheDocument();
    expect(
      screen.getByText("Adoração Contemplativa (Taizé)")
    ).toBeInTheDocument();
    expect(screen.getByText("Canto Gregoriano")).toBeInTheDocument();

    // Users can still start from scratch (default locale is pt-BR).
    expect(screen.getByText("Faixa em branco")).toBeInTheDocument();
  });
});
