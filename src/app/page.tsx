import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Musicalizer Magic — AI-Powered Music Production Workbench",
  description:
    "Generate, iterate, and perfect your tracks with AI. Multi-provider generation, version control, and intelligent evaluation in one workbench.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    icon: "🎵",
    title: "Multi-Provider AI Generation",
    description:
      "Suno & Minimax with 10+ model versions — pick the right AI engine for your sound.",
  },
  {
    icon: "🔄",
    title: "Version Control",
    description:
      "Clone, compare, and track every creative iteration. Never lose a great idea.",
  },
  {
    icon: "🧠",
    title: "AI Assistance",
    description:
      "Prompt suggestions, lyrics generator, auto-naming — Claude helps at every step.",
  },
  {
    icon: "📊",
    title: "Evaluation System",
    description:
      "7-dimension scoring with radar chart visualization to find your best version.",
  },
  {
    icon: "🎨",
    title: "Theme System",
    description:
      "Extract musical themes from URLs and documents with AI to inform your tracks.",
  },
  {
    icon: "⚡",
    title: "Batch Generation",
    description:
      "Generate 3 variations from AI-mutated prompts at once to explore creative directions.",
  },
];

const steps = [
  { number: "01", title: "Create a track", description: "Name your project and set the stage." },
  { number: "02", title: "Configure style & provider", description: "Choose genre, mood, and AI engine." },
  { number: "03", title: "Generate with AI", description: "Let Suno or Minimax bring your vision to life." },
  { number: "04", title: "Evaluate & iterate", description: "Score, compare, and refine to perfection." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatNote1 {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50%  { transform: translateY(-40px) rotate(15deg); opacity: 0.35; }
          100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
        }
        @keyframes floatNote2 {
          0%   { transform: translateY(0px) rotate(-10deg); opacity: 0.1; }
          50%  { transform: translateY(-60px) rotate(10deg); opacity: 0.3; }
          100% { transform: translateY(0px) rotate(-10deg); opacity: 0.1; }
        }
        @keyframes floatNote3 {
          0%   { transform: translateY(0px) rotate(5deg); opacity: 0.12; }
          50%  { transform: translateY(-30px) rotate(-8deg); opacity: 0.28; }
          100% { transform: translateY(0px) rotate(5deg); opacity: 0.12; }
        }
        .hero-gradient {
          background: linear-gradient(135deg, #3b0764, #4c1d95, #312e81, #1e1b4b, #3b0764);
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
        }
        .note-1 { animation: floatNote1 6s ease-in-out infinite; }
        .note-2 { animation: floatNote2 8s ease-in-out infinite 1s; }
        .note-3 { animation: floatNote3 7s ease-in-out infinite 2s; }
        .note-4 { animation: floatNote1 9s ease-in-out infinite 0.5s; }
        .note-5 { animation: floatNote2 5s ease-in-out infinite 3s; }
        .text-gradient {
          background: linear-gradient(135deg, #c084fc, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Floating music notes */}
        <span className="note-1 pointer-events-none absolute left-[8%] top-[20%] select-none text-6xl text-purple-300">♩</span>
        <span className="note-2 pointer-events-none absolute left-[18%] top-[65%] select-none text-5xl text-violet-300">♪</span>
        <span className="note-3 pointer-events-none absolute right-[10%] top-[30%] select-none text-7xl text-indigo-300">♫</span>
        <span className="note-4 pointer-events-none absolute right-[22%] top-[70%] select-none text-4xl text-purple-400">♬</span>
        <span className="note-5 pointer-events-none absolute left-[42%] top-[10%] select-none text-5xl text-violet-400">𝄞</span>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-900/30 px-4 py-1.5 text-sm text-purple-200 backdrop-blur-sm">
          <span>✨</span>
          <span>AI-Powered Music Production</span>
        </div>

        {/* Headline */}
        <h1 className="text-gradient mb-6 text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
          Musicalizer Magic
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-purple-100/80 sm:text-xl">
          Generate, iterate, and perfect your tracks with AI. Multi-provider
          generation, version control, and intelligent evaluation in one
          workbench.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Launch App →
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-white/5 px-8 py-3.5 text-base font-semibold text-purple-200 backdrop-blur-sm transition hover:border-purple-400/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-[#0d0d18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
            Everything you need to produce great music
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-purple-300/70">
            A complete AI-powered workbench — from first idea to final track.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-6 transition hover:border-purple-700/50 hover:bg-purple-950/30"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-purple-200/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#0a0a0f] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mb-16 max-w-lg text-center text-purple-300/70">
            From blank canvas to finished track in four simple steps.
          </p>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line (not on last) */}
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-6 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-violet-600/50 to-transparent lg:block" />
                )}
                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/50 bg-violet-900/40 text-sm font-bold text-violet-300">
                  {step.number}
                </div>
                <h3 className="mb-2 font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-purple-200/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="hero-gradient px-6 py-24 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Ready to make music?
        </h2>
        <p className="mx-auto mb-10 max-w-md text-purple-100/70">
          Start generating tracks, comparing versions, and perfecting your sound
          with AI — for free.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-violet-700 shadow-lg transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Launch App →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080810] px-6 py-8 text-center text-sm text-purple-400/50">
        Musicalizer Magic · Built with Next.js + Claude AI
      </footer>
    </main>
  );
}
