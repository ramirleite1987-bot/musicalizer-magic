"use client";

import { useState } from "react";
import { Loader2, KeyRound, Brain, Music2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateSettings,
  setApiKey,
  type ApiKeyProvider,
  type SettingsView,
} from "@/app/actions/settings";

const KEY_PROVIDERS: Array<{
  id: ApiKeyProvider;
  label: string;
  hint: string;
  placeholder: string;
}> = [
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "Used for AI lyrics, names, evaluations, and prompt suggestions (any model on openrouter.ai).",
    placeholder: "sk-or-v1-…",
  },
  {
    id: "suno",
    label: "Suno",
    hint: "Used for music generation with the Suno provider.",
    placeholder: "suno api key",
  },
  {
    id: "minimax",
    label: "Minimax",
    hint: "Used for Minimax music generation, and for AI text features when Minimax is the LLM provider.",
    placeholder: "minimax api key",
  },
];

export function SettingsForm({ initial }: { initial: SettingsView }) {
  return (
    <div className="space-y-6">
      <ModelSection initial={initial} />
      <KeysSection initial={initial} />
    </div>
  );
}

function ModelSection({ initial }: { initial: SettingsView }) {
  const [llmProvider, setLlmProvider] = useState(initial.llmProvider);
  const [llmModel, setLlmModel] = useState(initial.llmModel);
  const [defaultMusicProvider, setDefaultMusicProvider] = useState(
    initial.defaultMusicProvider
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ llmProvider, llmModel, defaultMusicProvider });
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const modelPlaceholder =
    llmProvider === "minimax" ? "MiniMax-M2" : "anthropic/claude-sonnet-4.5";

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
        <Brain className="w-4 h-4 text-violet-400" />
        AI Model
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">
            LLM provider
          </label>
          <select
            value={llmProvider}
            onChange={(e) => setLlmProvider(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="minimax">Minimax</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Model id</label>
          <input
            value={llmModel}
            onChange={(e) => setLlmModel(e.target.value)}
            placeholder={modelPlaceholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Leave empty to use the default ({modelPlaceholder}).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5" />
            Default music provider
          </label>
          <select
            value={defaultMusicProvider}
            onChange={(e) => setDefaultMusicProvider(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
          >
            <option value="suno">Suno</option>
            <option value="minimax">Minimax</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Without an API key for the selected LLM provider, AI features fall back
        to the server&apos;s default model.
      </p>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
      >
        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Save
      </button>
    </section>
  );
}

function KeysSection({ initial }: { initial: SettingsView }) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-violet-400" />
          API Keys
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Keys are encrypted at rest (AES-256-GCM) and never shown again in
          full. When a key is missing, the server-wide key is used if one is
          configured.
        </p>
      </div>

      {KEY_PROVIDERS.map((p) => (
        <KeyRow
          key={p.id}
          provider={p.id}
          label={p.label}
          hint={p.hint}
          placeholder={p.placeholder}
          masked={initial.keys[p.id]}
        />
      ))}
    </section>
  );
}

function KeyRow({
  provider,
  label,
  hint,
  placeholder,
  masked,
}: {
  provider: ApiKeyProvider;
  label: string;
  hint: string;
  placeholder: string;
  masked: string | null;
}) {
  const [value, setValue] = useState("");
  const [currentMask, setCurrentMask] = useState(masked);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (key: string) => {
    setIsSaving(true);
    try {
      await setApiKey(provider, key);
      setCurrentMask(key ? `••••${key.trim().slice(-4)}` : null);
      setValue("");
      toast.success(key ? `${label} key saved` : `${label} key removed`);
    } catch (err) {
      toast.error(`Failed to update ${label} key`, {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-zinc-800 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <span className="text-xs font-mono text-zinc-500">
          {currentMask ?? "not configured"}
        </span>
      </div>
      <p className="text-[11px] text-zinc-500 mb-2">{hint}</p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={() => save(value)}
          disabled={isSaving || !value.trim()}
          className="flex items-center gap-1.5 border border-violet-700 text-violet-300 hover:bg-violet-950/40 disabled:opacity-40 text-sm rounded-lg px-3 py-2 transition-colors"
        >
          {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save
        </button>
        {currentMask && (
          <button
            onClick={() => save("")}
            disabled={isSaving}
            title={`Remove ${label} key`}
            className="border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 disabled:opacity-40 rounded-lg p-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
