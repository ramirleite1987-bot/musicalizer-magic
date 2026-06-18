import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreateTrackDialog } from "@/components/create-track-dialog";

vi.mock("@/app/actions/tracks", () => ({ createTrack: vi.fn() }));

describe("CreateTrackDialog", () => {
  it("surfaces Catholic templates (featured) plus a blank option when open", () => {
    render(<CreateTrackDialog open onOpenChange={() => {}} />);

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

    // Users can still start from scratch.
    expect(screen.getByText("Blank track")).toBeInTheDocument();
  });
});
