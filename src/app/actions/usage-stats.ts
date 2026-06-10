"use server";

import { getDb } from "@/lib/db";
import { generationLogs } from "@/lib/db/schema";
import { sql, gte } from "drizzle-orm";

const COST_PER_GENERATION: Record<string, number> = {
  suno: 0.05,
  minimax: 0.03,
};

export interface UsageStats {
  totalGenerations: number;
  byProvider: { suno: number; minimax: number };
  successRate: number;
  last30Days: { date: string; count: number }[];
  estimatedCost: number;
}

export async function getUsageStats(): Promise<UsageStats> {
  const db = getDb();

  // Total generations (non-started rows, or all rows)
  const totalResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(generationLogs);
  const totalGenerations = totalResult[0]?.count ?? 0;

  // By provider — count started entries per provider
  const byProviderResult = await db
    .select({
      provider: generationLogs.provider,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(generationLogs)
    .groupBy(generationLogs.provider);

  const byProvider: { suno: number; minimax: number } = { suno: 0, minimax: 0 };
  for (const row of byProviderResult) {
    if (row.provider === "suno") byProvider.suno = row.count;
    else if (row.provider === "minimax") byProvider.minimax = row.count;
  }

  // Success rate (complete / (complete + failed))
  const statusResult = await db
    .select({
      status: generationLogs.status,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(generationLogs)
    .groupBy(generationLogs.status);

  let completeCount = 0;
  let failedCount = 0;
  for (const row of statusResult) {
    if (row.status === "complete") completeCount = row.count;
    if (row.status === "failed") failedCount = row.count;
  }
  const terminal = completeCount + failedCount;
  const successRate = terminal > 0 ? completeCount / terminal : 0;

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30DaysResult = await db
    .select({
      date: sql<string>`to_char(${generationLogs.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(generationLogs)
    .where(gte(generationLogs.createdAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${generationLogs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${generationLogs.createdAt}, 'YYYY-MM-DD')`);

  const last30Days = last30DaysResult.map((r) => ({
    date: r.date,
    count: r.count,
  }));

  // Estimated cost — based on started rows per provider
  const startedByProviderResult = await db
    .select({
      provider: generationLogs.provider,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(generationLogs)
    .where(sql`${generationLogs.status} = 'started' OR ${generationLogs.status} = 'complete' OR ${generationLogs.status} = 'failed'`)
    .groupBy(generationLogs.provider);

  let estimatedCost = 0;
  for (const row of startedByProviderResult) {
    const costPerGen = COST_PER_GENERATION[row.provider] ?? 0.05;
    estimatedCost += row.count * costPerGen;
  }

  return {
    totalGenerations,
    byProvider,
    successRate,
    last30Days,
    estimatedCost,
  };
}
