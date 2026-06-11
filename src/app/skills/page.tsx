import Link from "next/link";
import { getAllSkills } from "@/app/actions/skills";
import { SkillsLibrary } from "@/components/skills-library";
import type { SkillDefinition } from "@/data/default-skills";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  let skills: SkillDefinition[] = [];
  let error: string | null = null;

  try {
    skills = await getAllSkills();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load skills";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Skills Library</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Reusable writing techniques the AI applies when generating lyrics
              and prompts
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-6 text-red-300 text-sm">
            {error}
          </div>
        ) : (
          <SkillsLibrary initialSkills={skills} />
        )}
      </div>
    </div>
  );
}
