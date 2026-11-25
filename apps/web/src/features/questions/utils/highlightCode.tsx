import * as React from "react";

const KEYWORDS = new Set([
  "function",
  "const",
  "let",
  "var",
  "return",
  "if",
  "else",
  "while",
  "for",
  "async",
  "await",
  "class",
  "public",
  "private",
  "static",
  "void",
  "int",
  "boolean",
  "new",
  "try",
  "catch",
  "def",
  "import",
  "from",
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INDEX",
  "CREATE",
  "ON",
]);

const BOOLEANS_AND_NULLISH = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
]);

const TOKEN_REGEX =
  /(\/\/.*$|--.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

/**
 * XSS-safe, zero-dependency single-line syntax tokenizer for VS Code Dark+ styling.
 * Never uses dangerouslySetInnerHTML.
 */
export function highlightCodeLine(line: string): React.ReactNode {
  if (!line) return " ";

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`t-${lastIndex}`} className="text-[#E4E4E7]">
          {line.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const token = match[0];
    let className = "text-[#E4E4E7]";

    if (
      token.startsWith("//") ||
      token.startsWith("--") ||
      token.startsWith("#")
    ) {
      className = "text-[#6B7280] italic";
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      className = "text-[#A7F3D0]";
    } else if (/^\d/.test(token)) {
      className = "text-[#FBBF24]";
    } else if (BOOLEANS_AND_NULLISH.has(token)) {
      className = "text-[#F59E0B]";
    } else if (KEYWORDS.has(token)) {
      className = "text-[#38BDF8] font-medium";
    }

    nodes.push(
      <span key={`k-${match.index}`} className={className}>
        {token}
      </span>,
    );

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <span key={`e-${lastIndex}`} className="text-[#E4E4E7]">
        {line.slice(lastIndex)}
      </span>,
    );
  }

  return nodes;
}

/**
 * Infers a clean filename label for the IDE window tab from code & topic hints.
 */
export function inferCodeFilename(code: string, topicHint = ""): string {
  const combined = `${topicHint}\n${code}`;
  if (/\b(SELECT|CREATE\s+TABLE|CREATE\s+INDEX|JOIN|WHERE)\b/i.test(code)) {
    return "query.sql";
  }
  if (/\bpublic\s+class\b|\bSystem\.out\.println\b|\bpublic\s+static\s+void\b/.test(code)) {
    return "Solution.java";
  }
  if (/\bdef\s+\w+\s*\(|\bimport\s+\w+|\bself\b/.test(code)) {
    return "solution.py";
  }
  if (
    /:\s*(string|number|boolean|void|unknown)\b|\binterface\s+\w+|\btype\s+\w+\s*=/.test(
      combined,
    )
  ) {
    return "solution.ts";
  }
  return "solution.js";
}
