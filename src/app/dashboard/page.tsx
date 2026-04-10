import { getTracks } from "@/app/actions/tracks";
import { getThemes } from "@/app/actions/themes";
import type { Theme, Track } from "@/types/music";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let tracks: Track[] = [];
  let themes: Theme[] = [];
  let loadWarning: string | null = null;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    loadWarning =
      process.env.NODE_ENV === "development"
        ? "DATABASE_URL is not set. Add it to .env (see .env.example) or configure it in your host (e.g. Vercel → Environment Variables)."
        : "Database connection is not configured. Add DATABASE_URL in your deployment environment (Vercel project settings).";
  } else {
    try {
      [tracks, themes] = await Promise.all([getTracks(), getThemes()]);
    } catch (err) {
      console.error("[dashboard] failed to load tracks/themes", err);
      loadWarning =
        process.env.NODE_ENV === "development" && err instanceof Error
          ? err.message
          : "Could not load data from the database. Confirm DATABASE_URL, run migrations (npm run db:migrate), and check your database provider logs.";
    }
  }

  return (
    <DashboardClient
      initialTracks={tracks}
      initialThemes={themes}
      loadWarning={loadWarning}
    />
  );
}
