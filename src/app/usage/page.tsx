import Link from "next/link";
import { getUsageStats } from "@/app/actions/usage-stats";
import { getServerDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function UsagePage() {
  const dict = await getServerDictionary();
  let stats;
  let error: string | null = null;

  try {
    stats = await getUsageStats();
  } catch (err) {
    error = err instanceof Error ? err.message : dict.usage.loadFailed;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{dict.usage.title}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {dict.usage.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            {dict.usage.backToDashboard}
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-6 text-red-300 text-sm">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label={dict.usage.totalGenerations}
                value={stats.totalGenerations.toString()}
              />
              <StatCard
                label={dict.usage.successRate}
                value={`${(stats.successRate * 100).toFixed(1)}%`}
                subtext={
                  stats.totalGenerations === 0
                    ? dict.usage.noDataYet
                    : undefined
                }
              />
              <StatCard
                label={dict.usage.estimatedCost}
                value={`$${stats.estimatedCost.toFixed(2)}`}
                subtext="Suno $0.05 · Minimax $0.03"
              />
              <StatCard
                label={dict.usage.providers}
                value={`${stats.byProvider.suno + stats.byProvider.minimax}`}
                subtext={`Suno: ${stats.byProvider.suno} · Minimax: ${stats.byProvider.minimax}`}
              />
            </div>

            {/* Provider breakdown */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">
                {dict.usage.providerBreakdown}
              </h2>
              <ProviderBar
                sunoCount={stats.byProvider.suno}
                minimaxCount={stats.byProvider.minimax}
                emptyLabel={dict.usage.noGenerationsYet}
              />
            </div>

            {/* Bar chart: last 30 days */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4">
                {dict.usage.last30Days}
              </h2>
              {stats.last30Days.length === 0 ? (
                <p className="text-sm text-zinc-500">{dict.usage.noActivity30Days}</p>
              ) : (
                <BarChart data={stats.last30Days} />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {subtext && (
        <p className="text-xs text-zinc-500 mt-1">{subtext}</p>
      )}
    </div>
  );
}

function ProviderBar({
  sunoCount,
  minimaxCount,
  emptyLabel,
}: {
  sunoCount: number;
  minimaxCount: number;
  emptyLabel: string;
}) {
  const total = sunoCount + minimaxCount;
  if (total === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }
  const sunoPct = (sunoCount / total) * 100;
  const minimaxPct = (minimaxCount / total) * 100;

  return (
    <div className="space-y-3">
      <ProviderBarRow
        label="Suno"
        count={sunoCount}
        pct={sunoPct}
        color="bg-violet-500"
      />
      <ProviderBarRow
        label="Minimax"
        count={minimaxCount}
        pct={minimaxPct}
        color="bg-blue-500"
      />
    </div>
  );
}

function ProviderBarRow({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-300 w-20 text-right flex-shrink-0">
        {count} ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 120;
  const barWidth = 8;
  const barGap = 4;
  const leftPad = 30;
  const bottomPad = 24;
  const topPad = 8;
  const totalWidth = leftPad + data.length * (barWidth + barGap);
  const totalHeight = chartHeight + bottomPad + topPad;

  // Y axis gridlines
  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(totalWidth, 300)}
        height={totalHeight}
        className="block"
        aria-label="Generations per day bar chart"
      >
        {/* Y-axis gridlines and labels */}
        {yTicks.map((tick) => {
          const y = topPad + chartHeight - (tick / maxCount) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={leftPad}
                x2={Math.max(totalWidth, 300)}
                y1={y}
                y2={y}
                stroke="#3f3f46"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <text
                x={leftPad - 4}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="#71717a"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max((d.count / maxCount) * chartHeight, d.count > 0 ? 2 : 0);
          const x = leftPad + i * (barWidth + barGap);
          const y = topPad + chartHeight - barH;

          // Show date label for first, last, and every ~7th bar
          const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
          const labelDate = d.date.slice(5); // MM-DD

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={2}
                fill="#7c3aed"
                opacity={0.85}
              />
              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={topPad + chartHeight + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#71717a"
                >
                  {labelDate}
                </text>
              )}
              {/* Tooltip-like count above bar */}
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 2}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#a1a1aa"
                >
                  {d.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
