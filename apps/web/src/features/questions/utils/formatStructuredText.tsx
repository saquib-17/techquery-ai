import * as React from "react";

/**
 * Renders inline **bold** and `code` tokens safely as React nodes without dangerouslySetInnerHTML.
 */
function renderInlineTokens(text: string): React.ReactNode {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  tokenRegex.lastIndex = 0;
  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`b-${match.index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={`c-${match.index}`}
          className="rounded bg-[#0B0B0E] border border-[#242429] px-1.5 py-0.5 font-mono text-[12px] text-[#34D399]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Strips stray outer bold wrappers (e.g. `** - **Frontend:** ... **`) and splits
 * inline or newline-delimited bullets into clean structured segments.
 */
function parseSegments(raw: string): Array<{ type: "bullet" | "paragraph"; text: string }> {
  let cleaned = raw.trim();
  // Remove stray leading/trailing ** wrappers around whole fields
  cleaned = cleaned.replace(/^\*{2,}\s*|\s*\*{2,}$/g, "").trim();

  // Normalize inline bullets like "text. - **Label:** ..." into newline-separated bullets
  const normalized = cleaned.replace(/\s+(?:[-•])\s+(?=\*\*|[A-Z0-9`])/g, "\n- ");

  const rawLines = normalized
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const segments: Array<{ type: "bullet" | "paragraph"; text: string }> = [];

  for (const line of rawLines) {
    if (/^(?:[-*•])\s+/.test(line)) {
      const bulletText = line
        .replace(/^(?:[-*•])\s+/, "")
        .replace(/^\*{2,}\s*|\s*\*{2,}$/g, "")
        .trim();
      if (bulletText) {
        segments.push({ type: "bullet", text: bulletText });
      }
    } else {
      segments.push({ type: "paragraph", text: line });
    }
  }

  return segments;
}

export interface FormattedAnswerTextProps {
  text: string;
  className?: string;
}

export function FormattedAnswerText({
  text,
  className,
}: FormattedAnswerTextProps) {
  const segments = React.useMemo(() => parseSegments(text), [text]);

  if (segments.length === 0) return null;

  // Group consecutive bullets into <ul> lists and paragraphs into <p> tags
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (keyPrefix: string) => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${keyPrefix}`} className="space-y-2">
        {bulletBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#10B981]" />
            <span>{renderInlineTokens(item)}</span>
          </li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  segments.forEach((seg, idx) => {
    if (seg.type === "bullet") {
      bulletBuffer.push(seg.text);
    } else {
      flushBullets(String(idx));
      blocks.push(
        <p key={`p-${idx}`} className="leading-relaxed">
          {renderInlineTokens(seg.text)}
        </p>,
      );
    }
  });
  flushBullets("end");

  return <div className={className ?? "space-y-2.5"}>{blocks}</div>;
}
