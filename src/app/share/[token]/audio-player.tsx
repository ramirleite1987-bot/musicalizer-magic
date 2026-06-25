"use client";

import dynamic from "next/dynamic";

const WaveformPlayer = dynamic(
  () => import("@/components/waveform-player").then((m) => m.WaveformPlayer),
  { ssr: false }
);

interface ShareAudioPlayerProps {
  audioUrl: string;
  fileName?: string;
}

export function ShareAudioPlayer({ audioUrl, fileName }: ShareAudioPlayerProps) {
  return <WaveformPlayer audioUrl={audioUrl} fileName={fileName} />;
}
