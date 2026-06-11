import dynamic from "next/dynamic";
import Link from "next/link";
import { getShareLink } from "@/app/actions/share";
import type { DimensionScores, TrackVersion } from "@/types/music";

const WaveformPlayer = dynamic(
  () => import("@/components/waveform-player").then((m) => m.WaveformPlayer),
  { ssr: false }
);

interface SharePageProps {
  params: Promise<{ token: string }>;
}

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  melody: "Melody",
  harmony: "Harmony",
  rhythm: "Rhythm",
  production: "Production",
  lyricsFit: "Lyrics Fit",
  originality: "Originality",
  emotionalImpact: "Emotional Impact",
};

function parseLyricsLine(line: string): { isHeader: boolean; text: string } {
  const isHeader = /^\[.+\]$/.test(line.trim());
  return { isHeader, text: line };
}

function LyricsDisplay({ lyrics }: { lyrics: string }) {
  const lines = lyrics.split("\n");

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const { isHeader, text } = parseLyricsLine(line);
        if (text.trim() === "") {
          return <div key={i} className="h-3" />;
        }
        if (isHeader) {
          return (
            <div
              key={i}
              className="text-violet-400 font-semibold text-xs uppercase tracking-wider pt-2"
            >
              {text}
            </div>
          );
        }
        return (
          <div key={i} className="text-zinc-300">
            {text}
          </div>
        );
      })}
    </div>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 w-6 text-right flex-shrink-0">
        {value}
      </span>
    </div>
  );
}

function DimensionScoreChart({ scores }: { scores: DimensionScores }) {
  return (
    <div className="space-y-2">
      {(Object.keys(DIMENSION_LABELS) as Array<keyof DimensionScores>).map((key) => (
        <DimensionBar key={key} label={DIMENSION_LABELS[key]} value={scores[key]} />
      ))}
    </div>
  );
}

function StyleSummary({ version }: { version: TrackVersion }) {
  const { style } = version;
  const items: { label: string; value: string }[] = [];

  if (style.genre) items.push({ label: "Genre", value: style.genre });
  if (style.moods?.length)
    items.push({ label: "Mood", value: style.moods.join(", ") });
  if (style.tempo) items.push({ label: "Tempo", value: `${style.tempo} BPM` });
  if (style.key)
    items.push({
      label: "Key",
      value: `${style.key} ${style.isMinor ? "minor" : "major"}`,
    });
  if (style.vocalStyle)
    items.push({ label: "Vocals", value: style.vocalStyle });
  if (style.instruments?.length)
    items.push({ label: "Instruments", value: style.instruments.join(", ") });
  if (style.duration) items.push({ label: "Duration", value: style.duration });

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">
            {label}
          </dt>
          <dd className="text-sm text-zinc-200">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const data = await getShareLink(token).catch(() => null);

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold text-zinc-700">404</div>
          <h1 className="text-xl font-semibold text-zinc-300">
            Share link not found or revoked
          </h1>
          <p className="text-zinc-500 text-sm">
            This link may have expired or been removed by its creator.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
          >
            Go to Musicalizer Magic
          </Link>
        </div>
      </div>
    );
  }

  const { trackName, versionData } = data;
  const hasAudio = Boolean(versionData.audioUrl);
  const hasLyrics = Boolean(versionData.lyrics?.trim());
  const hasScores = Object.values(versionData.dimensionScores ?? {}).some(
    (v) => (v as number) > 0
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
              v{versionData.versionNumber}
            </span>
            {versionData.style?.genre && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-950 text-violet-300 text-xs font-medium">
                {versionData.style.genre}
              </span>
            )}
            {versionData.isBest && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-950 text-yellow-300 text-xs font-medium">
                ★ Best Version
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {trackName}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Waveform player */}
        {hasAudio && versionData.audioUrl && (
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
              Audio
            </h2>
            <WaveformPlayer
              audioUrl={versionData.audioUrl}
              fileName={versionData.audioFileName ?? `${trackName}-v${versionData.versionNumber}.mp3`}
            />
          </section>
        )}

        {/* Lyrics */}
        {hasLyrics && (
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
              Lyrics
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <LyricsDisplay lyrics={versionData.lyrics} />
            </div>
          </section>
        )}

        {/* Style summary */}
        {versionData.style && (
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
              Style
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <StyleSummary version={versionData} />
            </div>
          </section>
        )}

        {/* Dimension scores */}
        {hasScores && versionData.dimensionScores && (
          <section>
            <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
              Evaluation Scores
            </h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
              <DimensionScoreChart scores={versionData.dimensionScores} />
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <span>Made with</span>
          <Link
            href="/"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Musicalizer Magic
          </Link>
        </div>
      </footer>
    </div>
  );
}
