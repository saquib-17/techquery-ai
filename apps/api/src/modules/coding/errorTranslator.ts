import type { ExecutionVerdict } from "@techquery/shared";

export interface ErrorTranslationInput {
  verdict: ExecutionVerdict;
  caseNumber?: number;
  compileOutput?: string;
  stderr?: string;
}

/**
 * Translates raw Judge0 / compiler / runtime outcomes into clear, actionable
 * plain-English guidance for learners.
 */
export function translateExecutionError(input: ErrorTranslationInput): string {
  const caseLabel = input.caseNumber ? `Test Case #${input.caseNumber}` : "a test case";

  switch (input.verdict) {
    case "ACCEPTED":
      return "All test cases passed!";

    case "COMPILATION_ERROR": {
      const raw = (input.compileOutput || input.stderr || "").trim();
      const firstLine = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 0 && !l.startsWith("Note:"));
      if (firstLine) {
        const cleanHint = firstLine.slice(0, 180);
        return `Compilation Error — please check your syntax and method signature (${cleanHint}).`;
      }
      return "Compilation Error — please check your syntax, missing semicolons/brackets, or method signature.";
    }

    case "TIME_LIMIT_EXCEEDED":
      return `Time Limit Exceeded on ${caseLabel} — your solution may be too slow for the problem constraints.`;

    case "RUNTIME_ERROR":
      return `Runtime Error on ${caseLabel} — check array bounds, null/empty inputs, or integer overflow.`;

    case "WRONG_ANSWER":
      return `Wrong Answer on ${caseLabel} — compare your output with the expected output and check edge cases.`;
  }
}

/**
 * Translates Judge0 HTTP / network / timeout errors into a calm, reassuring
 * plain-English message.
 */
export function translateJudge0ServiceError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (/abort|timeout|timed out|network|fetch|econnrefused|502|503|504/i.test(msg)) {
    return "Code runner is temporarily busy — your code is safely saved. Try running again in a moment.";
  }
  return "Code runner is temporarily busy — your code is safely saved. Try running again in a moment.";
}
