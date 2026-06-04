import type { GenerationStats, ProviderStats } from "@/app/actions/generation-stats";

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function successRate(p: ProviderStats): string {
  const total = p.succeeded + p.failed;
  if (total === 0) return "—";
  return `${Math.round((p.succeeded / total) * 100)}%`;
}

interface Props {
  stats: GenerationStats;
}

export function GenerationStatsCard({ stats }: Props) {
  if (stats.providers.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-950">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Generation activity
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          No generations recorded in the last {stats.windowDays} days.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Generation activity
        </h2>
        <p className="text-xs text-zinc-500">
          Last {stats.windowDays} days
        </p>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {stats.providers.map((p) => (
          <li
            key={p.provider}
            className="px-6 py-4 grid grid-cols-5 gap-4 text-sm"
          >
            <span className="font-medium capitalize text-zinc-700 dark:text-zinc-200">
              {p.provider}
            </span>
            <Metric label="Started" value={p.started.toString()} />
            <Metric label="Succeeded" value={p.succeeded.toString()} />
            <Metric label="Success rate" value={successRate(p)} />
            <Metric label="Avg latency" value={formatLatency(p.avgLatencyMs)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="text-zinc-800 dark:text-zinc-100 font-mono">{value}</div>
    </div>
  );
}
