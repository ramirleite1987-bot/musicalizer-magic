"use client";

import type { DimensionScores } from "@/types/music";

interface RadarChartProps {
  scores: DimensionScores;
  bestScores?: DimensionScores;
  size?: number;
}

const AXES: { key: keyof DimensionScores; label: string }[] = [
  { key: "melody", label: "Melody" },
  { key: "harmony", label: "Harmony" },
  { key: "rhythm", label: "Rhythm" },
  { key: "production", label: "Prod." },
  { key: "lyricsFit", label: "Lyrics" },
  { key: "originality", label: "Original." },
  { key: "emotionalImpact", label: "Emotion" },
];

const N = AXES.length; // 7

/** Returns {x, y} for the tip of axis i, at radius r, centred on (cx, cy).
 *  Axis 0 points straight up (−π/2). */
function axisPoint(
  i: number,
  r: number,
  cx: number,
  cy: number
): { x: number; y: number } {
  const angle = (2 * Math.PI * i) / N - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

/** Build an SVG polygon points string for a set of scores normalised to [0,1]. */
function buildPolygonPoints(
  values: number[], // already normalised 0-1
  maxR: number,
  cx: number,
  cy: number
): string {
  return values
    .map((v, i) => {
      const { x, y } = axisPoint(i, v * maxR, cx, cy);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Build an SVG polygon points string for a concentric grid ring. */
function buildGridPoints(fraction: number, maxR: number, cx: number, cy: number): string {
  return Array.from({ length: N }, (_, i) => {
    const { x, y } = axisPoint(i, fraction * maxR, cx, cy);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

export function RadarChart({ scores, bestScores, size = 280 }: RadarChartProps) {
  const padding = 44; // space for labels
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - padding;

  // Normalise scores to [0, 1] (clamp, handle 0-10 range)
  const currentValues = AXES.map(({ key }) =>
    Math.min(1, Math.max(0, (scores[key] ?? 0) / 10))
  );
  const bestValues = bestScores
    ? AXES.map(({ key }) =>
        Math.min(1, Math.max(0, (bestScores[key] ?? 0) / 10))
      )
    : null;

  const gridLevels = [
    { fraction: 1 / 3, label: "3" },
    { fraction: 2 / 3, label: "6" },
    { fraction: 1, label: "10" },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Radar chart of dimension scores"
        role="img"
      >
        {/* ── Grid rings ── */}
        {gridLevels.map(({ fraction, label }) => {
          const pts = buildGridPoints(fraction, maxR, cx, cy);
          const labelPt = axisPoint(0, fraction * maxR, cx, cy);
          return (
            <g key={fraction}>
              <polygon
                points={pts}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.75}
                className="text-zinc-300 dark:text-zinc-700"
                strokeDasharray={fraction < 1 ? "3 3" : undefined}
              />
              {/* ring label on the top axis, offset slightly left */}
              <text
                x={labelPt.x - 14}
                y={labelPt.y + 4}
                fontSize={8}
                className="fill-zinc-400 dark:fill-zinc-500"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* ── Axis spokes ── */}
        {AXES.map((_, i) => {
          const tip = axisPoint(i, maxR, cx, cy);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={tip.x.toFixed(2)}
              y2={tip.y.toFixed(2)}
              stroke="currentColor"
              strokeWidth={0.75}
              className="text-zinc-300 dark:text-zinc-700"
            />
          );
        })}

        {/* ── Best version polygon (rendered first so current overlays it) ── */}
        {bestValues && (
          <>
            <polygon
              points={buildPolygonPoints(bestValues, maxR, cx, cy)}
              fill="#f59e0b"
              fillOpacity={0.2}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              strokeLinejoin="round"
            />
            {bestValues.map((v, i) => {
              const pt = axisPoint(i, v * maxR, cx, cy);
              return (
                <circle
                  key={i}
                  cx={pt.x.toFixed(2)}
                  cy={pt.y.toFixed(2)}
                  r={3}
                  fill="#f59e0b"
                  stroke="white"
                  strokeWidth={1}
                />
              );
            })}
          </>
        )}

        {/* ── Current version polygon ── */}
        <polygon
          points={buildPolygonPoints(currentValues, maxR, cx, cy)}
          fill="#7c3aed"
          fillOpacity={0.35}
          stroke="#7c3aed"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {currentValues.map((v, i) => {
          const pt = axisPoint(i, v * maxR, cx, cy);
          return (
            <circle
              key={i}
              cx={pt.x.toFixed(2)}
              cy={pt.y.toFixed(2)}
              r={3.5}
              fill="#7c3aed"
              stroke="white"
              strokeWidth={1.5}
            />
          );
        })}

        {/* ── Axis labels ── */}
        {AXES.map(({ label }, i) => {
          // Push labels beyond the outer ring with a small extra gap
          const labelR = maxR + 18;
          const { x, y } = axisPoint(i, labelR, cx, cy);
          // Determine text-anchor based on horizontal position relative to centre
          let anchor: "start" | "middle" | "end" = "middle";
          const dx = x - cx;
          if (dx > 4) anchor = "start";
          else if (dx < -4) anchor = "end";
          // Vertical baseline nudge
          const dominantBaseline =
            y < cy - 4 ? "auto" : y > cy + 4 ? "hanging" : "middle";
          return (
            <text
              key={label}
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              fontSize={10}
              fontWeight={500}
              textAnchor={anchor}
              dominantBaseline={dominantBaseline}
              className="fill-zinc-600 dark:fill-zinc-400"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* ── Legend ── */}
      {bestValues && (
        <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: "#7c3aed", opacity: 0.8 }}
            />
            Current
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{
                background: "transparent",
                border: "2px dashed #f59e0b",
              }}
            />
            Best
          </span>
        </div>
      )}
    </div>
  );
}
