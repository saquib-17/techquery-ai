import type { AnswerAIResponse, AnswerStyle } from "./answer.schemas.js";

export interface AnswerFallbackContext {
  questionText: string;
  category: string;
  difficulty: string;
  targetedSkill: string;
  interviewerIntent: string;
  keyEvaluationPoints: string[];
  style: AnswerStyle;
  resumeText?: string;
  jdTitle?: string;
  jdCompany?: string | null;
}

/**
 * Deterministic offline fallback engine for Model Answer Generation.
 * Produces schema-valid, tailored answers without requiring Ollama or network access.
 * Accurately formats BEHAVIORAL/PROJECT_DEFENSE in 4-part STAR structure with null code/complexity,
 * and formats CODING/THEORETICAL/SYSTEM_DESIGN with concrete code examples and Big-O notation.
 */
export function deterministicAnswerFallback(
  context: AnswerFallbackContext
): AnswerAIResponse {
  const {
    category,
    targetedSkill,
    jdTitle,
  } = context;

  const isBehavioral =
    category === "BEHAVIORAL" || category === "PROJECT_DEFENSE";

  if (isBehavioral) {
    const roleMention = jdTitle || "Senior Software Engineer";
    const skillMention = targetedSkill || "System Architecture & Delivery";

    return {
      shortSummary: `In my engineering career targeting the ${roleMention} role, I demonstrated disciplined problem solving and proactive ownership when executing critical projects involving ${skillMention}.`,
      detailedExplanation:
        `**Situation**: During a major system scalability milestone, our team identified unexpected bottlenecks around ${skillMention} that threatened key release deliverables.\n\n` +
        `**Task**: As a key engineering contributor, my goal was to diagnose the root causes, establish structured benchmarks, and remediate the issue within a 3-week sprint while maintaining sprint velocity.\n\n` +
        `**Action**: I conducted deep-dive diagnostics into our architecture, isolated the performance bottlenecks, and introduced automated validation checks. I organized daily engineering standups, aligned technical trade-offs across cross-functional stakeholders, and implemented defensive recovery fallbacks.\n\n` +
        `**Result**: We successfully delivered the project on schedule, improved system responsiveness by 38%, and established new architectural best practices adopted across engineering teams.`,
      codeSnippet: null,
      timeComplexity: null,
      spaceComplexity: null,
      commonMistakes: [
        "Failing to articulate individual contribution versus general team activities ('We fixed it' instead of 'I spearheaded').",
        "Omitting measurable, quantifiable metrics or business outcomes from the final Result section.",
        "Overlooking post-incident retrospectives and long-term prevention strategies.",
      ],
    };
  }

  // Technical questions: CODING, THEORETICAL, SYSTEM_DESIGN
  const isCoding = category === "CODING";
  const isSystemDesign = category === "SYSTEM_DESIGN";

  const codeSnippet = isCoding
    ? `// Idiomatic TypeScript implementation for ${targetedSkill}\nexport function solve<T>(input: T[]): T[] {\n  if (!input || input.length <= 1) return input;\n  const deduplicated = new Set<T>();\n  const result: T[] = [];\n  for (const item of input) {\n    if (!deduplicated.has(item)) {\n      deduplicated.add(item);\n      result.push(item);\n    }\n  }\n  return result;\n}`
    : `// Example schema & query optimization for ${targetedSkill}\nCREATE INDEX idx_perf_optimized ON records(tenant_id, created_at DESC);\nSELECT id, payload, status\nFROM records\nWHERE tenant_id = $1\nORDER BY created_at DESC\nLIMIT 100;`;

  return {
    shortSummary: `${targetedSkill} provides resilient performance, predictable concurrency management, and deterministic state handling when properly configured according to best practices.`,
    detailedExplanation:
      `To address this question thoroughly, we evaluate the foundational architecture, execution pipeline, and operational trade-offs of ${targetedSkill}.\n\n` +
      `1. **Core Mechanism & Design**: At its core, ${targetedSkill} optimizes throughput by reducing contention on shared resources. ${
        isSystemDesign
          ? "In a distributed system, we decouple ingestion from processing using message queues and partitioned databases."
          : "In execution pipelines, we utilize efficient memory structures to avoid unnecessary allocations."
      }\n\n` +
      `2. **Concurrency & Edge Cases**: Under heavy load, race conditions and resource exhaustion are mitigated via connection pooling, circuit breakers, and idempotent processing.\n\n` +
      `3. **Key Trade-offs**: While this approach guarantees ${
        isCoding ? "O(1) average lookup times" : "sub-50ms P95 latency"
      }, it introduces an auxiliary memory footprint of O(N) that must be accounted for during capacity planning.`,
    codeSnippet,
    timeComplexity: isCoding ? "O(N)" : "O(log N)",
    spaceComplexity: "O(N)",
    commonMistakes: [
      `Neglecting edge cases such as empty payloads or connection pool exhaustion in ${targetedSkill}.`,
      "Ignoring the trade-off between write throughput and secondary index maintenance overhead.",
      "Prematurely introducing distributed complexity when an in-process optimization solves the problem.",
    ],
  };
}
