"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTrackTags } from "@/app/actions/tracks";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

interface TrackTagsProps {
  trackId: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TrackTags({ trackId, tags, onTagsChange }: TrackTagsProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeTag = (raw: string): string => {
    // Strip leading # and trim whitespace, lowercase
    return raw.replace(/^#+/, "").trim().toLowerCase();
  };

  const addTag = async (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || tag.length === 0) return;
    if (tag.length > MAX_TAG_LENGTH) return;
    if (tags.includes(tag)) return;
    if (tags.length >= MAX_TAGS) return;

    const newTags = [...tags, tag];
    setIsSaving(true);
    try {
      await updateTrackTags(trackId, newTags);
      onTagsChange(newTags);
    } finally {
      setIsSaving(false);
    }
  };

  const removeTag = async (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setIsSaving(true);
    try {
      await updateTrackTags(trackId, newTags);
      onTagsChange(newTags);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = inputValue.replace(/,$/, "");
      addTag(value);
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Auto-commit if user typed a comma at the end
    if (val.endsWith(",")) {
      const tag = val.slice(0, -1);
      addTag(tag);
      setInputValue("");
    } else {
      setInputValue(val);
    }
  };

  const canAddMore = tags.length < MAX_TAGS;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 min-h-0",
        isSaving && "opacity-60"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 leading-none"
        >
          <span className="text-violet-400 dark:text-violet-500">#</span>
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            disabled={isSaving}
            className="ml-0.5 hover:text-violet-900 dark:hover:text-violet-100 transition-colors disabled:pointer-events-none"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}

      {canAddMore && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={tags.length === 0 ? "add tag..." : "+tag"}
          maxLength={MAX_TAG_LENGTH + 1 /* +1 for leading # */}
          className={cn(
            "min-w-0 bg-transparent text-[10px] text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
            "outline-none border-none focus:ring-0 p-0 leading-none",
            "w-14 disabled:opacity-50"
          )}
        />
      )}
    </div>
  );
}
