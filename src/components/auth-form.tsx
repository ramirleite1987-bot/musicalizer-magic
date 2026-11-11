"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { signIn, signUp } from "@/app/actions/auth";
import { useI18n } from "@/i18n/provider";
import { authCopy } from "@/i18n/auth";
import type { AuthFormState } from "@/lib/auth-form-state";

const initialState: AuthFormState = { error: null };
const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { locale } = useI18n();
  const copy = authCopy[locale];
  const registering = mode === "sign-up";
  const [state, action, pending] = useActionState(registering ? signUp : signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl sm:p-8">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-xl font-bold">
          <Music className="size-6 text-violet-400" aria-hidden="true" /> Musicalizer Magic
        </Link>
        <h1 className="text-2xl font-bold">{registering ? copy.signUp : copy.signIn}</h1>
        <p className="mb-6 mt-2 text-sm text-zinc-400">{registering ? copy.register : copy.welcome}</p>
        <form action={action} className="space-y-4">
          {registering && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">{copy.name}</label>
              <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} className={inputClass} />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">{copy.email}</label>
            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">{copy.password}</label>
            <input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={registering ? 12 : 1} maxLength={128} aria-describedby={registering ? "password-hint" : undefined} className={inputClass} />
            {registering && <p id="password-hint" className="text-xs text-zinc-400">{copy.hint}</p>}
          </div>
          {registering && (
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium">{copy.confirmPassword}</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className={inputClass} />
            </div>
          )}
          {state.error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300">{copy.errors[state.error]}</p>}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60">
            {pending ? copy.pending : registering ? copy.signUp : copy.signIn}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          {registering ? copy.hasAccount : copy.noAccount}{" "}
          <Link href={registering ? "/sign-in" : "/sign-up"} className="text-violet-400 hover:text-violet-300">{registering ? copy.signIn : copy.signUp}</Link>
        </p>
        <Link href="/" className="mt-4 block text-center text-xs text-zinc-500 hover:text-zinc-300">{copy.home}</Link>
      </div>
    </main>
  );
}
