"use client";

import { Wand2, Layers, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingEmptyStateProps {
  onCreateTrack: () => void;
}

const FEATURES = [
  {
    emoji: "🎵",
    title: "Multi-Provider AI Generation",
    description: "Suno & Minimax with full style control",
    icon: Sparkles,
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    emoji: "🎨",
    title: "Version Control & Evaluation",
    description: "Track every iteration with detailed scoring",
    icon: Layers,
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    emoji: "✨",
    title: "AI-Powered Assistance",
    description: "Prompt suggestions, lyrics generator, and more",
    icon: Star,
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
] as const;

export function OnboardingEmptyState({ onCreateTrack }: OnboardingEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full mx-auto text-center space-y-10">
        {/* Hero icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <Wand2 className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-400/30 scale-110" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-400/15 scale-125" />
          </div>
        </div>

        {/* Title & subtitle */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to Musicalizer Magic
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Your AI-powered music production workbench
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`relative rounded-xl border ${feature.border} bg-gradient-to-br ${feature.gradient} p-5 text-left space-y-2 backdrop-blur-sm`}
            >
              <div className="text-2xl" aria-hidden="true">
                {feature.emoji}
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {feature.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={onCreateTrack}
            size="lg"
            className="gap-2.5 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 px-8 text-base h-12"
          >
            <Sparkles className="w-5 h-5" />
            Create your first track
          </Button>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            or press{" "}
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              N
            </kbd>
          </p>
        </div>
      </div>
    </div>
  );
}
