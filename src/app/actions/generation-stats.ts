"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { generationEvents } from "@/lib/db/schema";

export interface ProviderStats {
  provider: string;
  started: number;
  succeeded: number;
  failed: number;
  avgLatencyMs: number | null;
}

export interface GenerationStats {
  windowDays: number;
  providers: ProviderStats[];
}

const WINDOW_DAYS = 30;

export async function getGenerationStats(): Promise<GenerationStats> {
  const db = getDb();

  const rows = await db
    .select({
      provider: generationEvents.provider,
      started: sql<number>`count(*)`,
      succeeded: sql<number>`count(*) filter (where ${generationEvents.status} = 'succeeded')`,
      failed: sql<number>`count(*) filter (where ${generationEvents.status} = 'failed')`,
      avgLatencyMs: sql<number | null>`avg(${generationEvents.latencyMs}) filter (where ${generationEvents.status} = 'succeeded')`,
    })
    .from(generationEvents)
    .where(
      sql`${generationEvents.startedAt} >= now() - (${WINDOW_DAYS} || ' days')::interval`
    )
    .groupBy(generationEvents.provider);

  const providers: ProviderStats[] = rows.map((r) => ({
    provider: r.provider,
    started: Number(r.started ?? 0),
    succeeded: Number(r.succeeded ?? 0),
    failed: Number(r.failed ?? 0),
    avgLatencyMs:
      r.avgLatencyMs === null || r.avgLatencyMs === undefined
        ? null
        : Math.round(Number(r.avgLatencyMs)),
  }));

  return { windowDays: WINDOW_DAYS, providers };
}
