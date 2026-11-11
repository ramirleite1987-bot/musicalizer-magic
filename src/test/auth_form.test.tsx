import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import { I18nProvider } from "@/i18n/provider";

const actions = vi.hoisted(() => ({
  signIn: vi.fn(async () => ({ error: "invalid_credentials" as const })),
  signUp: vi.fn(async () => ({ error: "registration_failed" as const })),
}));
vi.mock("@/app/actions/auth", () => actions);

describe("native authentication forms", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(cleanup);

  it("shows a localized error when signin fails", async () => {
    render(<I18nProvider initialLocale="pt-BR"><AuthForm mode="sign-in" /></I18nProvider>);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "musician@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "incorrect password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha incorretos."));
    expect(actions.signIn).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/sign-up");
  });

  it("offers password confirmation and accessible registration fields in English", () => {
    render(<I18nProvider initialLocale="en"><AuthForm mode="sign-up" /></I18nProvider>);
    expect(screen.getByLabelText("Name")).toBeRequired();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minlength", "12");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
  });
});
