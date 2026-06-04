import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getGenerationStats,
  type GenerationStats,
} from "@/app/actions/generation-stats";
import { GenerationStatsCard } from "@/components/generation-stats-card";

export const dynamic = "force-dynamic";

export default async function GenerationStatsPage() {
  let stats: GenerationStats = { windowDays: 30, providers: [] };
  let loadWarning: string | null = null;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    loadWarning =
      "DATABASE_URL is not set; generation stats are unavailable.";
  } else {
    try {
      stats = await getGenerationStats();
    } catch (err) {
      console.error("[stats] failed to load generation stats", err);
      loadWarning =
        err instanceof Error
          ? err.message
          : "Could not load generation stats from the database.";
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <h1 className="text-xl font-semibold">Generation analytics</h1>

        {loadWarning ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200"
          >
            {loadWarning}
          </div>
        ) : (
          <GenerationStatsCard stats={stats} />
        )}
      </div>
    </div>
  );
}
