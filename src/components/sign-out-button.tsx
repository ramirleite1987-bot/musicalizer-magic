"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useI18n } from "@/i18n/provider";
import { authCopy } from "@/i18n/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  const { locale } = useI18n();
  const label = authCopy[locale].signOut;
  return (
    <button type="submit" disabled={pending} title={label} aria-label={label} className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50">
      <LogOut className="size-4" aria-hidden="true" />
    </button>
  );
}

export function SignOutButton() {
  return <form action={signOut}><SubmitButton /></form>;
}
