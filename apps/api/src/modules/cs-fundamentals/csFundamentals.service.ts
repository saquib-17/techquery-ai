import { z } from "zod";
import {
  CS_FUNDAMENTALS_TOPICS,
  CS_SUBJECTS,
  type CsFundamentalItem,
  type CsFundamentalsSummary,
  type CsSubjectSummary,
  type CsTopicStatus,
  type CsTopicWithProgress,
  type CsVisualType,
  type CsWalkthroughDto,
  type UpdateCsProgressInput,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { NotFoundError } from "../../core/errors/AppError.js";

const CodeLangSchema = z.enum(["sql", "java", "python", "cpp", "javascript"]);
type CodeLang = z.infer<typeof CodeLangSchema>;

const StarWalkthroughAISchema = z.object({
  whatInterviewerTests: z.string().min(10),
  starFramework: z.object({
    situation: z.string().min(10),
    task: z.string().min(10),
    action: z.string().min(10),
    result: z.string().min(10),
  }),
  sampleSpokenAnswer: z.string().min(40),
  avoidMistakes: z.array(z.string().min(4)).min(1).max(5),
  interviewQuestions: z
    .array(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(10),
      })
    )
    .min(1)
    .max(4),
});

const CsWalkthroughAISchema = z.object({
  conceptBreakdown: z.string().min(20),
  realWorldAnalogy: z.string().min(10),
  visualType: z.enum(["CODE", "DIAGRAM", "STAR"]),
  visualTitle: z.string().min(3),
  codeOrQueryExample: z.string().default(""),
  exampleLanguage: CodeLangSchema.default("java"),
  diagramFlow: z.string().default(""),
  comparisonPoints: z
    .array(
      z.object({
        aspect: z.string().min(2),
        detail: z.string().min(4),
      })
    )
    .max(6)
    .default([]),
  interviewQuestions: z
    .array(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(10),
      })
    )
    .min(1)
    .max(5),
  commonTraps: z.array(z.string().min(4)).min(1).max(6),
});

const TOPIC_BY_SLUG = new Map(
  CS_FUNDAMENTALS_TOPICS.map((t) => [t.slug, t])
);

const OOP_CODE_SUBTOPICS = new Set([
  "OOP Core",
  "OOP Relationships",
  "SOLID & Clean Code",
  "Creational Patterns",
  "Behavioral Patterns",
  "Structural Patterns",
  "Runtime & Memory",
]);

export function normalizeMultilineText(raw: string): string {
  return raw
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "    ")
    .replace(/\r\n/g, "\n");
}

function resolveExpectedVisualType(topic: CsFundamentalItem): CsVisualType {
  if (topic.subject === "Behavioral & HR") {
    return "STAR";
  }
  if (topic.subject === "SQL & Query Patterns") {
    return "CODE";
  }
  if (
    topic.subject === "OOP & Software Engineering" &&
    OOP_CODE_SUBTOPICS.has(topic.subTopic)
  ) {
    return "CODE";
  }
  return "DIAGRAM";
}

function resolveVisualMode(topic: CsFundamentalItem): {
  visualType: CsVisualType;
  language: CodeLang;
  visualTitle: string;
} {
  const visualType = resolveExpectedVisualType(topic);
  if (visualType === "CODE") {
    if (topic.subject === "SQL & Query Patterns") {
      return {
        visualType: "CODE",
        language: "sql",
        visualTitle: "SQL Query Pattern",
      };
    }
    return {
      visualType: "CODE",
      language: "java",
      visualTitle: "Java Implementation Example",
    };
  }
  return {
    visualType: "DIAGRAM",
    language: "java",
    visualTitle: `${topic.subTopic} — Visual Flow & Architecture`,
  };
}

function buildFallbackVisual(topic: CsFundamentalItem): {
  visualType: CsVisualType;
  visualTitle: string;
  codeOrQueryExample: string;
  exampleLanguage: CodeLang;
  diagramFlow: string;
  comparisonPoints: Array<{ aspect: string; detail: string }>;
} {
  const mode = resolveVisualMode(topic);
  if (mode.visualType === "CODE") {
    const code =
      mode.language === "sql"
        ? `-- ${topic.title} (${topic.subTopic})\nSELECT dept_id, emp_name, salary,\n       DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk\nFROM employees\nWHERE status = 'ACTIVE';`
        : `// ${topic.title} (${topic.subTopic})\npublic final class ${topic.subTopic.replace(/[^A-Za-z0-9]/g, "")}Example {\n  public void execute() {\n    // ${topic.oneLineHook}\n  }\n}`;
    return {
      visualType: "CODE",
      visualTitle: mode.visualTitle,
      codeOrQueryExample: code,
      exampleLanguage: mode.language,
      diagramFlow: "",
      comparisonPoints: [],
    };
  }

  return {
    visualType: "DIAGRAM",
    visualTitle: mode.visualTitle,
    codeOrQueryExample: "",
    exampleLanguage: mode.language,
    diagramFlow: [
      `┌──────────────────────────────────────────────────────────┐`,
      `│  ${topic.title.slice(0, 54).padEnd(54)}  │`,
      `└──────────────────────────────────────────────────────────┘`,
      `                            │`,
      `                            ▼`,
      `┌────────────────────┐     ──▶     ┌───────────────────────┐`,
      `│  Input / Request   │             │  Core Mechanism       │`,
      `└────────────────────┘             │  (${topic.subTopic.slice(0, 19).padEnd(19)}) │`,
      `                                   └───────────────────────┘`,
      `                                                │`,
      `                                                ▼`,
      `┌──────────────────────────────────────────────────────────┐`,
      `│  Outcome: ${topic.oneLineHook.slice(0, 45).padEnd(45)}  │`,
      `└──────────────────────────────────────────────────────────┘`,
    ].join("\n"),
    comparisonPoints: [
      {
        aspect: "Core Mechanism",
        detail: topic.oneLineHook,
      },
      {
        aspect: "Primary Trade-off",
        detail: `Balances latency, consistency, and complexity in ${topic.subject}.`,
      },
      {
        aspect: "Interview Focus",
        detail: `Frequently probed by ${topic.companies.slice(0, 3).join(", ")}.`,
      },
    ],
  };
}

export class CsFundamentalsService {
  private readonly walkthroughCache = new Map<string, CsWalkthroughDto>();

  constructor(private ai: AIGateway = aiGateway) {}

  public async getSheetForUser(userId: string): Promise<{
    summary: CsFundamentalsSummary;
    topics: CsTopicWithProgress[];
  }> {
    const progressRows = await prisma.userCsProgress.findMany({
      where: { userId },
    });

    const progressMap = new Map(
      progressRows.map((row) => [row.topicSlug, row])
    );

    const byPriority = {
      MUST_KNOW: { total: 0, learned: 0 },
      IMPORTANT: { total: 0, learned: 0 },
      ADVANCED: { total: 0, learned: 0 },
    };

    const subjectMap = new Map<string, CsSubjectSummary>(
      CS_SUBJECTS.map((subject) => [
        subject,
        { subject, total: 0, learned: 0, revision: 0 },
      ])
    );

    let learned = 0;
    let revision = 0;

    const topics: CsTopicWithProgress[] = CS_FUNDAMENTALS_TOPICS.map(
      (item) => {
        const saved = progressMap.get(item.slug);
        const status: CsTopicStatus =
          (saved?.status as CsTopicStatus) ?? "UNSTUDIED";

        if (status === "LEARNED") learned += 1;
        if (status === "REVISION") revision += 1;

        byPriority[item.priority].total += 1;
        if (status === "LEARNED") byPriority[item.priority].learned += 1;

        const subSummary = subjectMap.get(item.subject);
        if (subSummary) {
          subSummary.total += 1;
          if (status === "LEARNED") subSummary.learned += 1;
          if (status === "REVISION") subSummary.revision += 1;
        }

        return {
          ...item,
          status,
          notes: saved?.notes ?? null,
          updatedAt: saved?.updatedAt ? saved.updatedAt.toISOString() : null,
        };
      }
    );

    return {
      summary: {
        total: CS_FUNDAMENTALS_TOPICS.length,
        learned,
        revision,
        unstudied: CS_FUNDAMENTALS_TOPICS.length - learned - revision,
        byPriority,
        subjects: CS_SUBJECTS.map((s) => subjectMap.get(s)!),
      },
      topics,
    };
  }

  public async updateProgress(
    userId: string,
    topicSlug: string,
    input: UpdateCsProgressInput
  ): Promise<{
    topicSlug: string;
    status: CsTopicStatus;
    notes: string | null;
    updatedAt: string;
  }> {
    if (!TOPIC_BY_SLUG.has(topicSlug)) {
      throw new NotFoundError(
        `CS Fundamentals topic '${topicSlug}' not found`
      );
    }

    const existing = await prisma.userCsProgress.findUnique({
      where: { userId_topicSlug: { userId, topicSlug } },
    });

    const nextStatus =
      input.status ?? (existing?.status as CsTopicStatus | undefined) ?? "UNSTUDIED";
    const nextNotes =
      input.notes !== undefined ? input.notes : (existing?.notes ?? null);

    const record = await prisma.userCsProgress.upsert({
      where: { userId_topicSlug: { userId, topicSlug } },
      create: {
        userId,
        topicSlug,
        status: nextStatus,
        notes: nextNotes,
      },
      update: {
        status: nextStatus,
        notes: nextNotes,
      },
    });

    return {
      topicSlug: record.topicSlug,
      status: record.status as CsTopicStatus,
      notes: record.notes ?? null,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async generateWalkthrough(
    userId: string,
    topicSlug: string
  ): Promise<CsWalkthroughDto> {
    const topic = TOPIC_BY_SLUG.get(topicSlug);
    if (!topic) {
      throw new NotFoundError(
        `CS Fundamentals topic '${topicSlug}' not found`
      );
    }

    const expectedType = resolveExpectedVisualType(topic);
    const cacheKey =
      expectedType === "STAR"
        ? `v6:${topicSlug}:${userId}`
        : `v6:${topicSlug}`;
    const cached = this.walkthroughCache.get(cacheKey);
    if (cached) return cached;

    if (expectedType === "STAR") {
      const latestResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
        select: { extractedText: true },
      });
      const resumeSnippet = latestResume?.extractedText
        ? latestResume.extractedText.slice(0, 1200)
        : "No uploaded resume yet — use realistic college / SDE-1 student project examples (e.g. a full-stack web app, hackathon project, or college team project).";

      const starPrompt = [
        "You are a friendly senior engineer & placement coach helping a college student/SDE-1 candidate answer a Behavioral / HR interview question.",
        `Question: "${topic.title}"`,
        `Category: ${topic.subTopic}`,
        `What it tests: ${topic.oneLineHook}`,
        `Candidate Resume Context:\n${resumeSnippet}`,
        "",
        "Return ONLY valid JSON matching this exact schema:",
        "{",
        '  "whatInterviewerTests": "1-2 plain-English sentences explaining what trait the interviewer is really looking for",',
        '  "starFramework": {',
        '    "situation": "1-2 simple sentences setting the scene",',
        '    "task": "1-2 simple sentences explaining what you needed to do",',
        '    "action": "2-3 simple sentences explaining the exact steps you took",',
        '    "result": "1-2 simple sentences sharing the outcome and what you learned"',
        "  },",
        '  "sampleSpokenAnswer": "A natural, conversational 120-160 word sample answer written in simple everyday spoken English (NO robotic corporate buzzwords like leverage, synergy, paradigm)",',
        '  "avoidMistakes": ["3 crisp red-flag mistakes candidates make on this question"],',
        '  "interviewQuestions": [{"question": "likely follow-up question HR will ask next", "answer": "simple tip on how to answer it"}]',
        "}",
        "",
        "CRITICAL RULES:",
        "- Write in warm, natural, spoken English — like a real person talking in an interview.",
        "- Provide 3 avoidMistakes and 2-3 follow-up interviewQuestions.",
      ].join("\n");

      const starFallback = (): z.infer<typeof StarWalkthroughAISchema> => ({
        whatInterviewerTests: `${topic.oneLineHook} Interviewers want to see real ownership, honesty, and clear communication rather than rehearsed buzzwords.`,
        starFramework: {
          situation:
            "Set the scene in 1–2 lines: mention the college project, internship, or team situation you were in.",
          task: `Explain clearly what your responsibility was when facing "${topic.title}".`,
          action:
            "Describe 2–3 concrete steps you personally took (e.g. broke the problem down, talked to teammates, tested edge cases, or built a working fix).",
          result:
            "Share the positive outcome (e.g. shipped on time, fixed the bug, improved speed) and one honest lesson you carried forward.",
        },
        sampleSpokenAnswer: `Sure! When I think about "${topic.title}", a good example is from a full-stack project I built with a small team during my final year. Halfway through, we ran into unexpected delays and had to rethink how we divided the work. My goal was to keep our core features working smoothly before our demo deadline. Instead of panicking, I listed the remaining tasks, picked up the backend API debugging myself, and synced with my teammate daily for 15 minutes so nobody stayed stuck. We ended up delivering the working app on time, and the experience taught me how important early communication and calm prioritization are when things get busy.`,
        avoidMistakes: [
          "Giving a vague, memorized textbook answer without a real story.",
          "Blaming teammates, professors, or tools instead of showing what you learned.",
          "Speaking for 4+ minutes without getting to your actions and the final result.",
        ],
        interviewQuestions: [
          {
            question: "What would you do differently if you faced that same situation today?",
            answer:
              "Mention one specific habit you improved since then, like writing tests earlier or aligning expectations upfront.",
          },
          {
            question: "How did your teammates or mentor react to your approach?",
            answer:
              "Share a brief, honest reaction showing how collaboration improved after your action.",
          },
        ],
      });

      const starResult = await this.ai.completeStructured(
        starPrompt,
        StarWalkthroughAISchema,
        {
          taskType: "AGEN",
          userId,
          rawInputText: `${topic.subject} ${topic.title}`,
          fallbackFn: starFallback,
        }
      );

      const starDto: CsWalkthroughDto = {
        topicSlug,
        title: topic.title,
        subject: topic.subject,
        conceptBreakdown: starResult.data.whatInterviewerTests,
        realWorldAnalogy: "",
        visualType: "STAR",
        visualTitle: "STAR Method Blueprint & Sample Answer",
        codeOrQueryExample: "",
        exampleLanguage: "java",
        diagramFlow: "",
        comparisonPoints: [],
        whatInterviewerTests: starResult.data.whatInterviewerTests,
        starFramework: starResult.data.starFramework,
        sampleSpokenAnswer: starResult.data.sampleSpokenAnswer,
        avoidMistakes: starResult.data.avoidMistakes,
        interviewQuestions: starResult.data.interviewQuestions,
        commonTraps: starResult.data.avoidMistakes,
        providerUsed:
          starResult.providerUsed === "MOCK"
            ? "FALLBACK"
            : starResult.providerUsed,
      };

      this.walkthroughCache.set(cacheKey, starDto);
      return starDto;
    }

    const mode = resolveVisualMode(topic);
    const visualInstructions =
      mode.visualType === "CODE"
        ? [
            `Set "visualType" to "CODE" and "exampleLanguage" to "${mode.language}".`,
            `Set "visualTitle" to "${mode.visualTitle}".`,
            'Populate "codeOrQueryExample" with a clean, multi-line runnable/readable code or SQL query specifically demonstrating THIS topic.',
            'Set "diagramFlow" to "" and "comparisonPoints" to [].',
          ]
        : [
            `Set "visualType" to "DIAGRAM" and "visualTitle" to "${mode.visualTitle}".`,
            'Set "codeOrQueryExample" to "" (NEVER write fake Java/Python/C++ programs to simulate non-coding theory topics like SDLC, Agile, OSI layers, Normalization, or CAP theorem).',
            'Populate "diagramFlow" with a crisp, readable multi-line Unicode box-and-arrow flowchart, protocol sequence, or architecture stack (using ┌───┐, │, ──▶, ▼) specific to THIS topic.',
            'Populate "comparisonPoints" with 3–4 crisp { "aspect": "...", "detail": "..." } rows comparing key stages, properties, or trade-offs of THIS topic.',
          ];

    const prompt = [
      "You are a senior staff engineer & CS interviewer creating a crisp, interview-ready deep dive.",
      `Target Topic (MUST match 100% — never substitute a different topic): "${topic.title}"`,
      `Subject: ${topic.subject} | Sub-Topic: ${topic.subTopic} | Priority: ${topic.priority}`,
      `Core Hook: ${topic.oneLineHook}`,
      `Frequently Asked At: ${topic.companies.join(", ")}`,
      "",
      "Return ONLY valid JSON matching this exact schema:",
      "{",
      '  "conceptBreakdown": "3-5 sentences directly explaining the internals, mechanics, and trade-offs of THIS exact topic (no generic boilerplate)",',
      '  "realWorldAnalogy": "1-2 sentence concrete everyday analogy specific to THIS topic",',
      `  "visualType": "${mode.visualType}",`,
      '  "visualTitle": "concise title for the visual aid",',
      '  "codeOrQueryExample": "multi-line SQL/Java code if visualType is CODE, else empty string",',
      `  "exampleLanguage": "${mode.language}",`,
      '  "diagramFlow": "multi-line Unicode flowchart/architecture diagram if visualType is DIAGRAM, else empty string",',
      '  "comparisonPoints": [{"aspect": "...", "detail": "..."}],',
      '  "interviewQuestions": [{"question": "specific interview question on THIS topic", "answer": "crisp 2-3 sentence model answer"}],',
      '  "commonTraps": ["3 specific misconceptions or follow-up traps interviewers test on THIS topic"]',
      "}",
      "",
      "CRITICAL RULES:",
      `- Every field MUST directly reference "${topic.title}" and its core mechanism (${topic.oneLineHook}).`,
      "- Provide exactly 3 interviewQuestions and 3 commonTraps.",
      ...visualInstructions.map((line) => `- ${line}`),
    ].join("\n");

    const fallbackVisual = buildFallbackVisual(topic);
    const fallback = (): z.infer<typeof CsWalkthroughAISchema> => ({
      conceptBreakdown: `${topic.title} is a high-frequency ${topic.subject} topic (${topic.subTopic}). ${topic.oneLineHook} In SDE-1 interviews at ${topic.companies.slice(0, 3).join(", ")}, interviewers expect you to explain how ${topic.title} works internally and what performance or correctness trade-offs it introduces.`,
      realWorldAnalogy: `Analogy for ${topic.title}: ${topic.oneLineHook} — much like coordinating dedicated lanes and checkpoints so concurrent requests never corrupt shared state.`,
      ...fallbackVisual,
      interviewQuestions: [
        {
          question: `Explain ${topic.title} and why it is critical in ${topic.subject}.`,
          answer: `${topic.oneLineHook} This directly governs correctness and latency under ${topic.subTopic} workloads.`,
        },
        {
          question: `What trade-offs or bottlenecks arise with ${topic.title}?`,
          answer: `Applying ${topic.title} requires balancing throughput, memory/storage overhead, and contention depending on workload read/write ratios.`,
        },
        {
          question: `How would ${topic.companies[0] ?? "a top tech company"} use or test ${topic.title} in production?`,
          answer: `Engineers apply ${topic.title} to keep ${topic.subTopic} predictable under peak concurrency while avoiding silent edge-case failures.`,
        },
      ],
      commonTraps: [
        `Giving a textbook definition of ${topic.title} without explaining its runtime/memory trade-offs.`,
        `Ignoring failure, concurrency, or boundary cases specific to ${topic.subTopic}.`,
        `Confusing ${topic.title} with adjacent mechanisms in ${topic.subject}.`,
      ],
    });

    const result = await this.ai.completeStructured(
      prompt,
      CsWalkthroughAISchema,
      {
        taskType: "AGEN",
        userId,
        rawInputText: `${topic.subject} ${topic.title} ${topic.subTopic}`,
        fallbackFn: fallback,
      }
    );

    const isCode = mode.visualType === "CODE";
    const dto: CsWalkthroughDto = {
      topicSlug,
      title: topic.title,
      subject: topic.subject,
      conceptBreakdown: result.data.conceptBreakdown,
      realWorldAnalogy: result.data.realWorldAnalogy,
      visualType: mode.visualType,
      visualTitle: result.data.visualTitle || mode.visualTitle,
      codeOrQueryExample: isCode
        ? normalizeMultilineText(
            result.data.codeOrQueryExample || fallbackVisual.codeOrQueryExample
          )
        : "",
      exampleLanguage: mode.language,
      diagramFlow: !isCode
        ? normalizeMultilineText(
            result.data.diagramFlow || fallbackVisual.diagramFlow
          )
        : "",
      comparisonPoints: !isCode
        ? result.data.comparisonPoints.length > 0
          ? result.data.comparisonPoints
          : fallbackVisual.comparisonPoints
        : [],
      interviewQuestions: result.data.interviewQuestions,
      commonTraps: result.data.commonTraps,
      providerUsed:
        result.providerUsed === "MOCK" ? "FALLBACK" : result.providerUsed,
    };

    this.walkthroughCache.set(cacheKey, dto);
    return dto;
  }
}

export const csFundamentalsService = new CsFundamentalsService();
