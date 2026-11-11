"use server";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endUserSession, startUserSession } from "@/lib/auth";
import { hashPassword, hashSessionToken, verifyPassword } from "@/lib/auth-password";
import { allowAuthAttempt, findAuthUser, insertAuthUser } from "@/lib/auth-store";
import type { AuthFormState } from "@/lib/auth-form-state";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});
const registration = credentials.extend({
  name: z.string().trim().min(2).max(80),
  password: z.string().min(12).max(128),
  confirmPassword: z.string().max(128),
}).refine((value) => value.password === value.confirmPassword);

async function authRequest(): Promise<string | null> {
  const requestHeaders = await headers();
  try {
    const origin = new URL(requestHeaders.get("origin") ?? "");
    if (!["https:", "http:"].includes(origin.protocol) || origin.host !== requestHeaders.get("host")) {
      return null;
    }
  } catch {
    return null;
  }
  // Vercel supplies this header itself. Never trust arbitrary forwarded headers locally.
  const forwarded = process.env.VERCEL === "1"
    ? requestHeaders.get("x-vercel-forwarded-for")?.trim()
    : undefined;
  return hashSessionToken(forwarded && isIP(forwarded) ? forwarded : "local");
}

export async function signIn(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const requestKey = await authRequest();
  if (!requestKey) return { error: "invalid_origin" };
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "invalid_fields" };
  try {
    if (!(await allowAuthAttempt(requestKey))) return { error: "rate_limited" };
    const user = await findAuthUser(parsed.data.email);
    const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? null);
    if (!user || !valid) return { error: "invalid_credentials" };
    await startUserSession(user.id);
  } catch {
    console.error("[auth] Sign-in unavailable");
    return { error: "unavailable" };
  }
  redirect("/dashboard");
}

export async function signUp(_previous: AuthFormState, form: FormData): Promise<AuthFormState> {
  const requestKey = await authRequest();
  if (!requestKey) return { error: "invalid_origin" };
  const parsed = registration.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "invalid_fields" };
  try {
    if (!(await allowAuthAttempt(requestKey))) return { error: "rate_limited" };
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await insertAuthUser({
      id: randomUUID(),
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
    });
    if (!user) return { error: "registration_failed" };
    await startUserSession(user.id);
  } catch {
    console.error("[auth] Sign-up unavailable");
    return { error: "unavailable" };
  }
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  if (!(await authRequest())) throw new Error("Invalid request origin");
  await endUserSession();
  redirect("/sign-in");
}
