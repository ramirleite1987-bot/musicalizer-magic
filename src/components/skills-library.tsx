"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { createSkill, updateSkill, deleteSkill } from "@/app/actions/skills";
import type { SkillDefinition } from "@/data/default-skills";

const CATEGORY_LABELS: Record<SkillDefinition["category"], string> = {
  lyrics: "Lyrics",
  prompt: "Prompt",
  general: "General",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "lyrics",
  instructions: "",
};

export function SkillsLibrary({
  initialSkills,
}: {
  initialSkills: SkillDefinition[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (skill: SkillDefinition) => {
    setEditingId(skill.id);
    setForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      instructions: skill.instructions,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updateSkill(editingId, form);
        toast.success("Skill updated");
      } else {
        await createSkill(form);
        toast.success("Skill created");
      }
      cancelForm();
      router.refresh();
    } catch (err) {
      toast.error("Failed to save skill", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (skill: SkillDefinition) => {
    setDeletingId(skill.id);
    try {
      await deleteSkill(skill.id);
      toast.success(`"${skill.name}" deleted`);
      if (editingId === skill.id) cancelForm();
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete skill", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const builtins = initialSkills.filter((s) => s.builtin);
  const custom = initialSkills.filter((s) => !s.builtin);

  return (
    <div className="space-y-8">
      {/* Create / edit form */}
      {showForm ? (
        <div className="rounded-lg border border-violet-800/60 bg-zinc-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              {editingId ? "Edit skill" : "New skill"}
            </h2>
            <button
              onClick={cancelForm}
              className="text-zinc-500 hover:text-zinc-300"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Skill name (e.g. Anthemic bridges)"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
            >
              <option value="lyrics">Lyrics</option>
              <option value="prompt">Prompt</option>
              <option value="general">General</option>
            </select>
          </div>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description (shown in the library)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
          />
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="Instructions the AI should follow when this skill is applied…"
            rows={4}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelForm}
              className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.name.trim() || !form.instructions.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingId ? "Update skill" : "Create skill"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New skill
        </button>
      )}

      {/* User skills */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Your skills {custom.length > 0 && `(${custom.length})`}
        </h2>
        {custom.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No custom skills yet. Create one to teach the AI your own writing
            techniques.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {custom.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onEdit={() => startEdit(skill)}
                onDelete={() => handleDelete(skill)}
                isDeleting={deletingId === skill.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Built-in skills */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Built-in</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {builtins.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SkillCard({
  skill,
  onEdit,
  onDelete,
  isDeleting,
}: {
  skill: SkillDefinition;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-medium text-sm text-zinc-100">{skill.name}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wide text-violet-300 bg-violet-950/60 border border-violet-800/50 rounded-full px-2 py-0.5">
            {CATEGORY_LABELS[skill.category]}
          </span>
          {skill.builtin ? (
            <span
              className="text-zinc-600"
              title="Built-in skill (read-only)"
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                title="Edit skill"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete skill"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
      {skill.description && (
        <p className="text-xs text-zinc-400 mb-2">{skill.description}</p>
      )}
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
        {skill.instructions}
      </p>
    </div>
  );
}
