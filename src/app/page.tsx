import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  Sparkles,
  Layers,
  Mic2,
  FlaskConical,
  BarChart2,
  KeyRound,
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span className="font-semibold tracking-tight">Musicalizer Magic</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-zinc-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="inline-flex items-center gap-2 text-xs font-medium text-violet-300 bg-violet-950/60 border border-violet-800/60 rounded-full px-3 py-1 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered music production workbench
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          Iterate your way to the{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            perfect track
          </span>
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
          Draft prompts and lyrics, generate with Suno or Minimax, score every
          version across seven dimensions, and let AI suggest the next
          improvement — all in one workspace.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg px-6 py-3 transition-colors"
          >
            Start producing free
          </Link>
          <Link
            href="/sign-in"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-medium rounded-lg px-6 py-3 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature
            icon={<Layers className="w-5 h-5 text-violet-400" />}
            title="Version everything"
            description="Every prompt, lyric, and style tweak becomes a numbered version. Clone, compare, and mark the best take."
          />
          <Feature
            icon={<Mic2 className="w-5 h-5 text-violet-400" />}
            title="Multi-provider generation"
            description="Generate audio with Suno or Minimax from the same brief and keep the results side by side."
          />
          <Feature
            icon={<Sparkles className="w-5 h-5 text-violet-400" />}
            title="AI lyrics & prompt skills"
            description="Generate lyrics, track names, and prompt improvements with your favorite model — boosted by a reusable skills library."
          />
          <Feature
            icon={<FlaskConical className="w-5 h-5 text-violet-400" />}
            title="Blind A/B listening"
            description="Compare versions without bias in blind listening tests and let your ears pick the winner."
          />
          <Feature
            icon={<BarChart2 className="w-5 h-5 text-violet-400" />}
            title="Usage analytics"
            description="Track generations, success rates, and estimated costs per provider over time."
          />
          <Feature
            icon={<KeyRound className="w-5 h-5 text-violet-400" />}
            title="Bring your own keys"
            description="Store your OpenRouter, Suno, and Minimax API keys encrypted at rest, and pick the LLM that writes for you."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 text-center text-sm text-zinc-500">
        Musicalizer Magic — craft, generate, evaluate, repeat.
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2.5 mb-2">
        {icon}
        <h3 className="font-semibold text-zinc-100">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
