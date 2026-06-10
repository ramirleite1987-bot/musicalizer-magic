"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "onboarding_dismissed";

const STEPS = [
  { label: "Create Track", step: 1 },
  { label: "Configure Style", step: 2 },
  { label: "Generate Audio", step: 3 },
  { label: "Evaluate & Iterate", step: 4 },
] as const;

export function OnboardingBanner() {
  // Use null as "unknown" to avoid SSR mismatch
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "true");
    } catch {
      // localStorage not available (e.g. private browsing with strict settings)
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  // Don't render until we know the dismissed state (avoids SSR flash)
  if (dismissed !== false) return null;

  return (
    <div className="relative mx-4 mt-3 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/8 to-blue-500/10 px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-semibold text-violet-400 shrink-0 uppercase tracking-wider">
        Workflow
      </span>

      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
        {STEPS.map((step, idx) => (
          <div key={step.step} className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-300">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-500/30 text-[10px] font-bold text-violet-200">
                {step.step}
              </span>
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss onboarding tip"
        className="shrink-0 rounded-md p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
