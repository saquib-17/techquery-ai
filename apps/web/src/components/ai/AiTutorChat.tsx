import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AiTutorContextType, AiTutorMessage } from "@techquery/shared";
import { Bot, Send, Sparkles, Trash2 } from "lucide-react";
import { aiTutorApi } from "./aiTutorApi";

export interface AiTutorChatProps {
  contextType: AiTutorContextType;
  contextId: string;
  contextTitle: string;
  contextSummary?: string;
  className?: string;
}

const QUICK_CHIPS_BY_CONTEXT: Record<AiTutorContextType, readonly string[]> = {
  CS_TOPIC: [
    "Explain simpler",
    "Real-life example",
    "Interview traps",
    "Quick quiz me",
  ],
  DSA_PROBLEM: [
    "Dry-run with example",
    "Why this time complexity?",
    "Common edge cases",
    "Give me a smaller hint",
  ],
  CODING_IDE: [
    "Why is my code failing?",
    "Explain time complexity",
    "Walk through an edge case",
    "Suggest a cleaner approach",
  ],
  OA_REVIEW: [
    "How to improve speed?",
    "Review my weak spots",
    "Optimal pattern summary",
    "Next practice plan",
  ],
  STUDY_ROADMAP: [
    "Break down this week",
    "I have less time today",
    "Best order to study",
    "Mock interview check",
  ],
  RESUME_MATCH: [
    "How to fix missing skills?",
    "Rewrite bullet for ATS",
    "Likely interview questions",
    "30-day gap closure plan",
  ],
};

function getStorageKey(contextType: AiTutorContextType, contextId: string): string {
  return `techquery_ai_tutor_${contextType}:${contextId}`;
}

function readStoredMessages(storageKey: string): AiTutorMessage[] {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AiTutorMessage =>
        Boolean(item) &&
        typeof item === "object" &&
        ((item as AiTutorMessage).role === "user" ||
          (item as AiTutorMessage).role === "assistant") &&
        typeof (item as AiTutorMessage).content === "string"
    );
  } catch {
    return [];
  }
}

function writeStoredMessages(storageKey: string, messages: AiTutorMessage[]): void {
  try {
    if (messages.length === 0) {
      window.sessionStorage.removeItem(storageKey);
    } else {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
    }
  } catch {
    // Ignore storage quota or SSR access errors
  }
}

function renderMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const firstNewline = inner.indexOf("\n");
      const codeBody =
        firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;
      return (
        <pre
          key={idx}
          className="mt-2 overflow-x-auto rounded-lg border border-[#242429] bg-[#0F0F11] p-2.5 font-mono text-xs leading-relaxed text-[#10B981]"
        >
          <code>{codeBody.trimEnd()}</code>
        </pre>
      );
    }

    if (!part.trim()) return null;

    return (
      <p key={idx} className="whitespace-pre-wrap text-xs leading-relaxed">
        {part}
      </p>
    );
  });
}

export function AiTutorChat({
  contextType,
  contextId,
  contextTitle,
  contextSummary = "",
  className = "",
}: AiTutorChatProps) {
  const storageKey = getStorageKey(contextType, contextId);
  const [messages, setMessages] = useState<AiTutorMessage[]>(() =>
    readStoredMessages(storageKey)
  );
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(readStoredMessages(storageKey));
    setInput("");
    setError(null);
    setIsSending(false);
  }, [storageKey]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  const chips = QUICK_CHIPS_BY_CONTEXT[contextType];

  async function handleSend(rawText?: string) {
    const trimmed = (rawText ?? input).trim().slice(0, 1000);
    if (!trimmed || isSending) return;

    const userMsg: AiTutorMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];

    setMessages(nextMessages);
    writeStoredMessages(storageKey, nextMessages);
    if (rawText === undefined) {
      setInput("");
    }
    setError(null);
    setIsSending(true);

    try {
      const response = await aiTutorApi.chat({
        contextType,
        contextId,
        contextTitle: contextTitle.slice(0, 300),
        contextSummary: contextSummary.slice(0, 4000),
        messages: nextMessages.slice(-10),
      });

      const assistantMsg: AiTutorMessage = {
        role: "assistant",
        content: response.reply,
      };
      const updated = [...nextMessages, assistantMsg];
      setMessages(updated);
      writeStoredMessages(storageKey, updated);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not reach the AI Mentor right now. Please try again.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  function handleClear() {
    setMessages([]);
    setError(null);
    writeStoredMessages(storageKey, []);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <section
      aria-label="Ask Your AI Mentor"
      className={`rounded-xl border border-[#242429] bg-[#151518] p-4 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#242429] pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold tracking-wide text-[#F4F4F5]">
              Ask Your AI Mentor
            </h4>
            <p className="truncate text-[11px] text-[#A1A1AA]">
              Scoped to: {contextTitle}
            </p>
          </div>
        </div>

        {messages.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-md border border-[#242429] bg-[#0F0F11] px-2 py-1 text-[11px] font-medium text-[#A1A1AA] transition hover:border-[#F59E0B]/40 hover:text-[#F4F4F5]"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isSending}
            onClick={() => void handleSend(chip)}
            className="rounded-full border border-[#242429] bg-[#0F0F11] px-2.5 py-1 text-[11px] font-medium text-[#D4D4D8] transition hover:border-[#10B981]/50 hover:text-[#10B981] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {messages.length > 0 ? (
        <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={`${index}-${msg.role}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 ${
                    isUser
                      ? "border border-[#10B981]/30 bg-[#10B981]/10 text-[#F4F4F5]"
                      : "border border-[#242429] bg-[#0F0F11] text-[#E4E4E7]"
                  }`}
                >
                  {!isUser ? (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#10B981]">
                      <Bot className="h-3 w-3" />
                      AI Mentor
                    </div>
                  ) : null}
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            );
          })}

          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-xl border border-[#242429] bg-[#0F0F11] px-3 py-2 text-xs text-[#A1A1AA]">
                Thinking...
              </div>
            </div>
          ) : null}
          <div ref={threadEndRef} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#71717A]">
          Tap a quick prompt above or ask a follow-up question below.
        </p>
      )}

      {error ? (
        <div
          role="alert"
          className="mt-2.5 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-2 text-xs text-[#F59E0B]"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up doubt..."
          aria-label="Ask a follow-up doubt"
          disabled={isSending}
          className="min-h-[38px] flex-1 resize-none rounded-lg border border-[#242429] bg-[#0F0F11] px-3 py-2 text-xs text-[#F4F4F5] placeholder-[#71717A] outline-none transition focus:border-[#10B981] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending || !input.trim()}
          aria-label="Send message"
          className="inline-flex h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-3 text-xs font-semibold text-[#0F0F11] transition hover:bg-[#34D399] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </button>
      </div>
    </section>
  );
}
