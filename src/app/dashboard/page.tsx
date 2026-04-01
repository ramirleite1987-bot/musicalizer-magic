import { getTracks } from "@/app/actions/tracks";
import { getThemes } from "@/app/actions/themes";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [tracks, themes] = await Promise.all([getTracks(), getThemes()]);

  return <DashboardClient initialTracks={tracks} initialThemes={themes} />;
}
