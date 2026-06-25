"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { X, Send, Trash2, Bot, User, Loader2, Sparkles, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  getChatMessages,
  sendChatMessage,
  clearChatHistory,
} from "@/app/actions/chat";
import type { ChatMessage } from "@/app/actions/chat";
import type { Track, TrackVersion } from "@/types/music";

interface CoProducerChatProps {
  track: Track;
  version: TrackVersion;
  onClose: () => void;
  onApplyPrompt: (content: string) => void;
  onApplyLyrics: (content: string) => void;
}

function MessageBubble({
  msg,
  onApply,
}: {
  msg: ChatMessage;
  onApply: (type: string, content: string) => void;
}) {
  const isUser = msg.role === "user";
  const [applied, setApplied] = useState<Record<string, boolean>>({});

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? "bg-violet-600"
            : "bg-zinc-700 dark:bg-zinc-700 border border-violet-500/30"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-violet-400" />
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Message text */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-violet-600 text-white rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>

        {/* Structured suggestions */}
        {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-col gap-2 w-full">
            {msg.suggestions.map((s, i) => {
              const key = `${i}-${s.type}`;
              const isApplied = applied[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-violet-500/20 bg-violet-950/20 dark:bg-violet-950/30 p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-violet-400 capitalize">
                      {s.type === "style_notes" ? "Style Notes" : s.type} suggestion
                    </span>
                    <Button
                      size="sm"
                      variant={isApplied ? "ghost" : "default"}
                      className={`h-6 px-2 text-xs ${
                        isApplied
                          ? "text-green-400"
                          : "bg-violet-600 hover:bg-violet-700 text-white"
                      }`}
                      onClick={() => {
                        onApply(s.type, s.content);
                        setApplied((prev) => ({ ...prev, [key]: true }));
                      }}
                    >
                      {isApplied ? (
                        <>
                          <CheckCheck className="w-3 h-3 mr-1" /> Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-2">{s.description}</p>
                  <div className="rounded-lg bg-background/70 border border-border/50 p-2 font-mono text-[11px] leading-relaxed text-foreground/70 max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {s.content.length > 300
                      ? s.content.slice(0, 300) + "…"
                      : s.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function CoProducerChat({
  track,
  version,
  onClose,
  onApplyPrompt,
  onApplyLyrics,
}: CoProducerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = messages === null;

  // Load chat history when track changes
  useEffect(() => {
    let cancelled = false;
    getChatMessages(track.id)
      .then((msgs) => { if (!cancelled) setMessages(msgs); })
      .catch(() => { if (!cancelled) setMessages([]); });
    return () => {
      cancelled = true;
      setMessages(null);
    };
  }, [track.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isPending) return;
    setInput("");

    // Optimistically add user message
    const optimisticUser: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      trackId: track.id,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...(prev ?? []), optimisticUser]);

    startTransition(async () => {
      try {
        const reply = await sendChatMessage(track.id, text, {
          track: { name: track.name, genre: track.genre, tags: track.tags },
          version: {
            versionNumber: version.versionNumber,
            prompt: version.prompt,
            negativePrompt: version.negativePrompt,
            lyrics: version.lyrics,
            style: version.style,
            rating: version.rating,
            dimensionScores: version.dimensionScores,
            notes: version.notes,
            feedback: version.feedback,
          },
          history: messages ?? [],
        });

        // Replace optimistic message + add reply
        setMessages((prev) => [
          ...(prev ?? []).filter((m) => m.id !== optimisticUser.id),
          optimisticUser,
          reply,
        ]);
      } catch {
        setMessages((prev) => (prev ?? []).filter((m) => m.id !== optimisticUser.id));
        toast.error("Failed to send message");
      }
    });
  }, [input, isPending, track, version, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = useCallback(() => {
    startTransition(async () => {
      await clearChatHistory(track.id);
      setMessages([]);
    });
  }, [track.id]);

  const handleApply = useCallback(
    (type: string, content: string) => {
      if (type === "prompt") {
        onApplyPrompt(content);
        toast.success("Prompt updated", {
          description: "AI suggestion applied to the prompt.",
        });
      } else if (type === "lyrics") {
        onApplyLyrics(content);
        toast.success("Lyrics updated", {
          description: "AI suggestion applied to the lyrics.",
        });
      } else {
        // style_notes: just copy to clipboard for now
        navigator.clipboard.writeText(content).then(() => {
          toast.success("Style notes copied", {
            description: "Paste into the Style tab notes as needed.",
          });
        });
      }
    },
    [onApplyPrompt, onApplyLyrics]
  );

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex flex-col w-full sm:w-96 bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Co-Producer</p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
              {track.name} · v{version.versionNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading history…</span>
            </div>
          ) : (messages ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Your AI Co-Producer is ready
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  Ask for feedback, request rewrites, or brainstorm new ideas for this track.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full mt-2">
                {[
                  "How can I improve this prompt?",
                  "Rewrite the lyrics with more energy",
                  "What's missing from this track?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="text-left px-3 py-2 rounded-lg border border-border hover:border-violet-500/40 hover:bg-violet-500/5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            (messages ?? []).map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onApply={handleApply} />
            ))
          )}
          {isPending && (
            <div className="flex gap-2 items-center text-muted-foreground">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-700 border border-violet-500/30 flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-muted text-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your co-producer…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: "40px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <Button
            size="icon"
            className="w-9 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex-shrink-0 disabled:opacity-50"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
