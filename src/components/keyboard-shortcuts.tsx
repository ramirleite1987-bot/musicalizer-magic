"use client";

import { useEffect, useCallback } from "react";
import { Keyboard, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeyboardShortcutHandlers {
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSwitchTab: (index: number) => void;
  onGenerate: () => void;
  onNewVersion: () => void;
  onCloneVersion: () => void;
  onToggleHelp: () => void;
}

// ---------------------------------------------------------------------------
// Helper: is focus inside a text input?
// ---------------------------------------------------------------------------

function isFocusInInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when focus is inside a text field
      if (isFocusInInput()) return;

      // Ignore when modifier keys are held (Ctrl, Meta, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          handlers.onNextTrack();
          break;
        case "k":
          e.preventDefault();
          handlers.onPrevTrack();
          break;
        case "1":
          e.preventDefault();
          handlers.onSwitchTab(0);
          break;
        case "2":
          e.preventDefault();
          handlers.onSwitchTab(1);
          break;
        case "3":
          e.preventDefault();
          handlers.onSwitchTab(2);
          break;
        case "4":
          e.preventDefault();
          handlers.onSwitchTab(3);
          break;
        case "5":
          e.preventDefault();
          handlers.onSwitchTab(4);
          break;
        case "6":
          e.preventDefault();
          handlers.onSwitchTab(5);
          break;
        case "g":
          e.preventDefault();
          handlers.onGenerate();
          break;
        case "n":
          e.preventDefault();
          handlers.onNewVersion();
          break;
        case "c":
          e.preventDefault();
          handlers.onCloneVersion();
          break;
        case "?":
          e.preventDefault();
          handlers.onToggleHelp();
          break;
        case "Escape":
          // Escape is handled inside KeyboardShortcutsHelp directly,
          // but we call onToggleHelp so the parent can close it.
          // The parent decides whether to close (no-op if already closed).
          handlers.onToggleHelp();
          break;
        default:
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

// ---------------------------------------------------------------------------
// Shortcut table data
// ---------------------------------------------------------------------------

const SHORTCUTS: { key: string; description: string }[] = [
  { key: "J", description: "Select next track in sidebar" },
  { key: "K", description: "Select previous track in sidebar" },
  { key: "1", description: "Switch to Versions tab" },
  { key: "2", description: "Switch to Prompt tab" },
  { key: "3", description: "Switch to Lyrics tab" },
  { key: "4", description: "Switch to Style tab" },
  { key: "5", description: "Switch to Themes tab" },
  { key: "6", description: "Switch to Evaluate tab" },
  { key: "G", description: "Trigger generation" },
  { key: "N", description: "Create new version" },
  { key: "C", description: "Clone current version" },
  { key: "?", description: "Toggle this help panel" },
  { key: "Esc", description: "Close this help panel" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  // Close on Escape key independently so it always works even without the
  // outer hook forwarding the event.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Always-visible toggle button (bottom-right corner) */}
      <button
        onClick={onClose}
        aria-label={open ? "Close keyboard shortcuts" : "Show keyboard shortcuts"}
        className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center justify-center",
          "w-9 h-9 rounded-full shadow-lg border transition-colors",
          "bg-zinc-900 dark:bg-zinc-800 border-zinc-700 dark:border-zinc-600",
          "text-zinc-300 hover:text-white hover:border-zinc-500",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        )}
        title="Keyboard shortcuts (?)"
      >
        {open ? (
          <X className="w-4 h-4" />
        ) : (
          <Keyboard className="w-4 h-4" />
        )}
      </button>

      {/* Floating help panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className={cn(
            "fixed bottom-16 right-4 z-50 w-72",
            "rounded-xl border border-zinc-700 dark:border-zinc-600",
            "bg-zinc-900 dark:bg-zinc-800 shadow-2xl",
            "text-zinc-100",
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 dark:border-zinc-600">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold">Keyboard Shortcuts</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-zinc-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Shortcut table */}
          <div className="p-2">
            <table className="w-full text-xs">
              <tbody>
                {SHORTCUTS.map(({ key, description }) => (
                  <tr
                    key={key}
                    className="group hover:bg-zinc-800 dark:hover:bg-zinc-700/50 rounded"
                  >
                    <td className="py-1 pl-2 pr-3 w-12">
                      <kbd
                        className={cn(
                          "inline-flex items-center justify-center",
                          "min-w-[1.75rem] px-1.5 py-0.5 rounded",
                          "bg-zinc-700 dark:bg-zinc-600",
                          "border border-zinc-600 dark:border-zinc-500",
                          "font-mono text-[11px] text-zinc-100",
                          "shadow-sm"
                        )}
                      >
                        {key}
                      </kbd>
                    </td>
                    <td className="py-1 pr-2 text-zinc-300">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-zinc-700 dark:border-zinc-600">
            <p className="text-[10px] text-zinc-500">
              Shortcuts are disabled when focus is inside a text field.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
