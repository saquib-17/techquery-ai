import type {
  QuestionCategory,
  QuestionDifficulty,
  QuestionSetAIResponse,
  QuestionItemAI,
} from "./question.schemas.js";

export interface FallbackQuestionContext {
  skills?: string[];
  topicFocus?: string;
  difficulty?: QuestionDifficulty;
  categories?: QuestionCategory[];
  count?: number;
  title?: string;
  jdTitle?: string;
  jdCompany?: string | null;
}

/**
 * Deterministic offline question generator fallback.
 * Generates an exact count of realistic, structured interview questions
 * aligned with the candidate's skills, target JD, difficulty, and requested categories.
 */
export function deterministicQuestionFallback(
  context: FallbackQuestionContext = {}
): QuestionSetAIResponse {
  const count = Math.max(3, Math.min(20, context.count ?? 10));
  const difficulty = context.difficulty || "MEDIUM";
  const topicFocus = context.topicFocus || "Core Software Engineering";

  const allCategories: QuestionCategory[] = [
    "THEORETICAL",
    "CODING",
    "SYSTEM_DESIGN",
    "BEHAVIORAL",
    "PROJECT_DEFENSE",
  ];
  const categories =
    context.categories && context.categories.length > 0
      ? context.categories
      : allCategories;

  const defaultSkills = [
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "AWS",
    "REST APIs",
    "Redis",
    "System Design",
    "Git",
  ];

  const candidateSkills =
    context.skills && context.skills.length > 0 ? context.skills : defaultSkills;

  const questions: QuestionItemAI[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const skill = candidateSkills[i % candidateSkills.length];

    let questionText = "";
    let interviewerIntent = "";
    let keyEvaluationPoints: string[] = [];

    switch (category) {
      case "THEORETICAL":
        questionText = `Explain how ${skill} handles memory management, concurrency, and performance bottlenecks under high throughput. What are the key architectural trade-offs to keep in mind?`;
        interviewerIntent = `Assesses candidate's deep conceptual foundation, memory mechanics, and trade-off evaluation in ${skill}.`;
        keyEvaluationPoints = [
          `Solid command of ${skill} runtime mechanics and concurrency model`,
          "Awareness of memory allocation, garbage collection, or resource leaks",
          "Ability to compare alternative solutions and explain technical trade-offs",
        ];
        break;

      case "CODING":
        questionText = `Design and implement an efficient algorithm or utility module using ${skill} that guarantees thread-safety and processes high-velocity batched requests with sub-linear complexity.`;
        interviewerIntent = `Evaluates algorithmic proficiency, modular code organization, error boundary handling, and time/space complexity optimization with ${skill}.`;
        keyEvaluationPoints = [
          `Production-grade, idiomatic usage of ${skill}`,
          "Edge-case identification (null values, buffer overflows, concurrency race conditions)",
          "Optimal time and space complexity with clear Big-O reasoning",
        ];
        break;

      case "SYSTEM_DESIGN":
        questionText = `Design a distributed, highly available subsystem utilizing ${skill} that handles sudden traffic spikes (50,000 RPM) while enforcing strict data consistency and zero single points of failure.`;
        interviewerIntent = `Tests high-level distributed systems decomposition, partitioning, caching strategies, and resilience patterns incorporating ${skill}.`;
        keyEvaluationPoints = [
          `Appropriate role and positioning of ${skill} in the overall architecture`,
          "Clear strategy for partitioning, replication, and failover recovery",
          "Understanding of CAP theorem trade-offs and latency SLAs",
        ];
        break;

      case "BEHAVIORAL":
        questionText = `Describe a complex project involving ${skill} where you faced an unexpected technical roadblock or severe timeline constraint. How did you diagnose the issue, manage team expectations, and deliver?`;
        interviewerIntent = `Evaluates engineering resilience, structured communication (STAR framework), collaboration, and pragmatism in delivery.`;
        keyEvaluationPoints = [
          "Structured narrative using Situation, Task, Action, and Result (STAR)",
          "Ownership and accountability rather than blaming team members or external tools",
          "Quantifiable impact and retrospective learnings from the challenge",
        ];
        break;

      case "PROJECT_DEFENSE":
        questionText = `In your past implementation involving ${skill}, what were the most critical scaling or architectural bottlenecks you encountered? If you were to redesign the system from scratch today, what would you change?`;
        interviewerIntent = `Validates authentic hands-on project experience, engineering maturity, critical reflection, and defensive reasoning under technical pressure.`;
        keyEvaluationPoints = [
          `Demonstrated deep hands-on ownership of ${skill} in the referenced project`,
          "Honest identification of technical debt and architectural trade-offs",
          "Clear rationale for why specific technologies and designs were chosen over alternatives",
        ];
        break;
    }

    questions.push({
      category,
      difficulty,
      targetedSkill: skill,
      questionText,
      interviewerIntent,
      keyEvaluationPoints,
    });
  }

  const generatedTitle =
    context.title ||
    (context.jdTitle
      ? `${context.jdTitle} Interview Practice Set`
      : `${topicFocus} (${difficulty}) - Practice Set`);

  return {
    title: generatedTitle,
    questions,
  };
}
