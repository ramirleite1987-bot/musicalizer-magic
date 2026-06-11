import Link from "next/link";
import { getSettings } from "@/app/actions/settings";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = null;
  let error: string | null = null;

  try {
    settings = await getSettings();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load settings";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Your AI model, API keys, and generation defaults
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-6 text-red-300 text-sm">
            {error}
          </div>
        ) : settings ? (
          <SettingsForm initial={settings} />
        ) : null}
      </div>
    </div>
  );
}
