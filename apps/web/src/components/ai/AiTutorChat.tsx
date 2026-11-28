import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AiTutorContextType, AiTutorMessage } from "@techquery/shared";
import { Bot, Check, Copy, Send, Sparkles, Trash2 } from "lucide-react";
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

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*))/g);

  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="rounded border border-[#242429] bg-[#0F0F11] px-1.5 py-0.5 font-mono text-[11px] text-[#10B981]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={i} className="italic text-zinc-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function CodeSnippetBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-[#242429] bg-[#0F0F11]">
      <div className="flex items-center justify-between border-b border-[#242429] bg-[#151518] px-3 py-1.5 text-[11px] text-[#A1A1AA]">
        <span className="font-mono uppercase text-[#10B981] font-semibold text-[10px]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] hover:text-white transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#10B981]" />
              <span className="text-[#10B981]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-[#10B981]">
        <code>{code.trimEnd()}</code>
      </pre>
    </div>
  );
}

function renderTextBlock(textBlock: string, blockKey: number | string) {
  const lines = textBlock.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-1.5 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-[#E4E4E7] leading-relaxed"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="my-1.5 space-y-1.5 pl-1">
          {currentList.items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs text-[#E4E4E7] leading-relaxed"
            >
              <span className="shrink-0 font-mono text-[11px] font-semibold text-[#10B981]">
                {idx + 1}.
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith("#### ")) {
      flushList();
      nodes.push(
        <h6
          key={`h4-${i}`}
          className="mt-2.5 mb-1 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
        >
          {renderInline(line.slice(5))}
        </h6>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h5
          key={`h3-${i}`}
          className="mt-3 mb-1 text-xs font-bold uppercase tracking-wider text-[#10B981]"
        >
          {renderInline(line.slice(4))}
        </h5>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h4
          key={`h2-${i}`}
          className="mt-3 mb-1.5 text-sm font-bold text-white tracking-wide"
        >
          {renderInline(line.slice(3))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      nodes.push(
        <h3
          key={`h1-${i}`}
          className="mt-3.5 mb-1.5 text-base font-bold text-white tracking-wide"
        >
          {renderInline(line.slice(2))}
        </h3>
      );
      continue;
    }

    // Divider
    if (line === "---" || line === "***") {
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="my-2 border-[#242429]" />);
      continue;
    }

    // Unordered lists: '* ' or '- '
    if (line.startsWith("* ") || line.startsWith("- ")) {
      const itemText = line.slice(2).trim();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Ordered lists: '1. ', '2. ', etc.
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[2]!.trim();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      continue;
    }

    // Regular paragraph line
    flushList();
    nodes.push(
      <p
        key={`p-${i}`}
        className="my-1 text-xs leading-relaxed text-[#E4E4E7]"
      >
        {renderInline(rawLine)}
      </p>
    );
  }

  flushList();

  return (
    <div key={blockKey} className="space-y-1">
      {nodes}
    </div>
  );
}

function renderMessageContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const firstNewline = inner.indexOf("\n");
      const language =
        firstNewline !== -1 ? inner.slice(0, firstNewline).trim() : "";
      const codeBody =
        firstNewline !== -1 ? inner.slice(firstNewline + 1) : inner;

      return (
        <CodeSnippetBlock
          key={idx}
          language={language}
          code={codeBody}
        />
      );
    }

    if (!part.trim()) return null;

    return renderTextBlock(part, idx);
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
