import * as React from "react";
import { Check, Copy } from "lucide-react";

export interface CodeSyntaxBlockProps {
  code: string;
  language: "java" | "python" | "cpp" | "javascript";
}

export function formatCodeForDisplay(
  rawCode: string,
  language: CodeSyntaxBlockProps["language"]
): string {
  const normalized = rawCode
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "    ")
    .trim();

  if (!normalized || language === "python" || normalized.split("\n").length > 2) {
    return normalized;
  }

  // Pretty-print single-line/minified brace-delimited code
  const lines: string[] = [];
  let current = "";
  let braceDepth = 0;
  let parenDepth = 0;
  let quote: string | null = null;
  let escaped = false;

  const pushLine = () => {
    const trimmed = current.trim();
    if (trimmed) {
      lines.push(`${"    ".repeat(braceDepth)}${trimmed}`);
    }
    current = "";
  };

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]!;

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === "(") {
      parenDepth += 1;
      current += ch;
      continue;
    }

    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
      continue;
    }

    if (ch === "{" && parenDepth === 0) {
      current = `${current.trimEnd()} {`;
      pushLine();
      braceDepth += 1;
      continue;
    }

    if (ch === "}" && parenDepth === 0) {
      pushLine();
      braceDepth = Math.max(0, braceDepth - 1);
      const nextNonSpace = normalized.slice(i + 1).match(/^\s*(;)/);
      if (nextNonSpace) {
        lines.push(`${"    ".repeat(braceDepth)}};`);
        i += normalized.slice(i + 1).indexOf(";") + 1;
      } else {
        lines.push(`${"    ".repeat(braceDepth)}}`);
      }
      continue;
    }

    if (ch === ";" && parenDepth === 0) {
      current += ";";
      pushLine();
      continue;
    }

    if (ch === "\n") {
      pushLine();
      continue;
    }

    current += ch;
  }

  pushLine();
  return lines.join("\n");
}

const LANGUAGE_DISPLAY: Record<CodeSyntaxBlockProps["language"], string> = {
  java: "Java",
  python: "Python",
  cpp: "C++",
  javascript: "JavaScript",
};

const CONTROL_KEYWORDS = new Set([
  "return",
  "for",
  "while",
  "if",
  "else",
  "elif",
  "break",
  "continue",
  "try",
  "catch",
  "throw",
  "import",
  "from",
  "pass",
  "switch",
  "case",
  "default",
  "in",
  "of",
  "and",
  "or",
  "not",
]);

const DECL_KEYWORDS = new Set([
  "public",
  "private",
  "protected",
  "class",
  "new",
  "const",
  "let",
  "var",
  "def",
  "function",
  "true",
  "false",
  "True",
  "False",
  "null",
  "None",
  "nullptr",
  "auto",
  "void",
  "static",
  "final",
  "this",
  "self",
  "struct",
  "extends",
  "implements",
  "using",
  "namespace",
]);

const TYPE_IDENTIFIERS = new Set([
  "int",
  "long",
  "double",
  "float",
  "boolean",
  "char",
  "String",
  "Integer",
  "Long",
  "Double",
  "Boolean",
  "Character",
  "Map",
  "HashMap",
  "TreeMap",
  "Set",
  "HashSet",
  "List",
  "ArrayList",
  "LinkedList",
  "Queue",
  "Deque",
  "ArrayDeque",
  "Stack",
  "PriorityQueue",
  "vector",
  "unordered_map",
  "unordered_set",
  "pair",
  "string",
  "bool",
  "Solution",
  "Arrays",
  "Collections",
  "Math",
  "Object",
  "Number",
]);

const TOKEN_REGEX =
  /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/gm;

function tokenizeLine(line: string): React.ReactNode[] {
  if (!line) return [" "];

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`p-${lastIndex}`} className="text-[#D4D4D4]">
          {line.slice(lastIndex, match.index)}
        </span>
      );
    }

    const token = match[0];
    const key = `t-${match.index}`;

    if (
      token.startsWith("//") ||
      token.startsWith("#") ||
      token.startsWith("/*")
    ) {
      nodes.push(
        <span key={key} className="text-[#6A9955] italic">
          {token}
        </span>
      );
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      nodes.push(
        <span key={key} className="text-[#CE9178]">
          {token}
        </span>
      );
    } else if (/^\d/.test(token)) {
      nodes.push(
        <span key={key} className="text-[#B5CEA8]">
          {token}
        </span>
      );
    } else if (CONTROL_KEYWORDS.has(token)) {
      nodes.push(
        <span key={key} className="text-[#C586C0]">
          {token}
        </span>
      );
    } else if (DECL_KEYWORDS.has(token)) {
      nodes.push(
        <span key={key} className="text-[#569CD6]">
          {token}
        </span>
      );
    } else if (TYPE_IDENTIFIERS.has(token)) {
      nodes.push(
        <span key={key} className="text-[#4EC9B0]">
          {token}
        </span>
      );
    } else {
      const nextChar = line[match.index + token.length];
      if (nextChar === "(") {
        nodes.push(
          <span key={key} className="text-[#DCDCAA]">
            {token}
          </span>
        );
      } else {
        nodes.push(
          <span key={key} className="text-[#D4D4D4]">
            {token}
          </span>
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <span key={`p-${lastIndex}`} className="text-[#D4D4D4]">
        {line.slice(lastIndex)}
      </span>
    );
  }

  return nodes;
}

export function CodeSyntaxBlock({ code, language }: CodeSyntaxBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const formattedCode = React.useMemo(
    () => formatCodeForDisplay(code, language),
    [code, language]
  );
  const lines = React.useMemo(
    () => formattedCode.split("\n"),
    [formattedCode]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable in headless environments
    }
  };

  return (
    <div className="rounded-lg border border-[#242429] bg-[#0D0E12] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#242429] bg-[#151518] px-3 py-1.5 font-mono text-[10px]">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#242429] px-1.5 py-0.5 text-zinc-200 font-semibold">
            {LANGUAGE_DISPLAY[language]}
          </span>
          <span className="text-zinc-500">VS Code Dark+</span>
        </div>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="h-3 w-3 text-[#10B981]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code Lines with Line-Number Gutter */}
      <div
        className="overflow-x-auto p-3 font-mono text-[11px] leading-5"
        style={{ fontVariantLigatures: "none" }}
      >
        <div className="min-w-max">
          {lines.map((line, idx) => (
            <div key={idx} className="flex">
              <span className="select-none w-7 shrink-0 pr-3 text-right text-zinc-600 tabular-nums">
                {idx + 1}
              </span>
              <span className="whitespace-pre">{tokenizeLine(line)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
