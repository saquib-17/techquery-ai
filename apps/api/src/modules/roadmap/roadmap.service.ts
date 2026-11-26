import { z } from "zod";
import {
  RoadmapPhaseSchema,
  type GenerateRoadmapInput,
  type LearningRoadmapDto,
  type RoadmapLevel,
  type RoadmapPhase,
  type ToggleRoadmapTaskInput,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { ForbiddenError, NotFoundError } from "../../core/errors/AppError.js";

const RoadmapAISchema = z.object({
  title: z.string().min(3).max(160),
  phases: z.array(RoadmapPhaseSchema).min(2).max(12),
});

function sanitizeUrl(rawUrl: string, fallbackQuery: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // Fall through to safe search URL
  }
  return `https://www.google.com/search?q=${encodeURIComponent(fallbackQuery)}`;
}

function normalizePhases(phases: RoadmapPhase[]): RoadmapPhase[] {
  return phases.map((phase, pIdx) => {
    const phaseNumber = pIdx + 1;
    return {
      ...phase,
      phaseNumber,
      tasks: phase.tasks.map((task, tIdx) => ({
        ...task,
        id: task.id || `p${phaseNumber}-t${tIdx + 1}`,
        order: tIdx + 1,
        completed: Boolean(task.completed),
      })),
      resources: phase.resources.map((res) => ({
        ...res,
        url: sanitizeUrl(res.url, `${res.title} ${res.platform}`),
      })),
    };
  });
}

function countTasks(phases: RoadmapPhase[]): {
  completedTasks: number;
  totalTasks: number;
} {
  let totalTasks = 0;
  let completedTasks = 0;
  for (const phase of phases) {
    for (const task of phase.tasks) {
      totalTasks += 1;
      if (task.completed) completedTasks += 1;
    }
  }
  return { completedTasks, totalTasks };
}

function toDto(row: {
  id: string;
  title: string;
  targetRole: string;
  durationWeeks: number;
  dailyHours: number;
  currentLevel: string;
  phases: unknown;
  createdAt: Date;
  updatedAt: Date;
}): LearningRoadmapDto {
  const parsed = z.array(RoadmapPhaseSchema).safeParse(row.phases);
  const phases = parsed.success ? parsed.data : [];
  const { completedTasks, totalTasks } = countTasks(phases);

  return {
    id: row.id,
    title: row.title,
    targetRole: row.targetRole,
    durationWeeks: row.durationWeeks,
    dailyHours: row.dailyHours,
    currentLevel: row.currentLevel as RoadmapLevel,
    phases,
    completedTasks,
    totalTasks,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildFallbackRoadmap(
  input: GenerateRoadmapInput
): z.infer<typeof RoadmapAISchema> {
  const phaseCount = input.durationWeeks <= 4 ? 2 : input.durationWeeks <= 8 ? 3 : 4;
  const weeksPerPhase = Math.max(1, Math.floor(input.durationWeeks / phaseCount));
  const skills = input.focusSkills?.length
    ? input.focusSkills
    : ["Data Structures & Algorithms", "System Design", "SQL & Databases"];

  const weekLabelFor = (idx: number): string => {
    const start = idx * weeksPerPhase + 1;
    const end =
      idx === phaseCount - 1
        ? input.durationWeeks
        : Math.min(input.durationWeeks, (idx + 1) * weeksPerPhase);
    return start === end ? `Week ${start}` : `Weeks ${start}–${end}`;
  };

  const hoursPerPhase = Math.round(weeksPerPhase * 7 * input.dailyHours);
  const taskHours = Math.max(2, Math.round(hoursPerPhase / 3));

  const templates: Array<{
    title: string;
    summary: string;
    milestone: string;
    tasks: Array<{ title: string; description: string }>;
    resources: RoadmapPhase["resources"];
  }> = [
    {
      title: `Core Foundations & ${skills[0] ?? "Problem Solving"}`,
      summary: `Build ${input.currentLevel.toLowerCase()} fluency in ${input.targetRole} fundamentals and daily coding patterns.`,
      milestone: `Complete 25+ core pattern problems and publish a clean ${input.targetRole} starter repository.`,
      tasks: [
        {
          title: `Master ${skills[0] ?? "Arrays, Hashing & Two Pointers"}`,
          description: `Practice time/space complexity analysis and solve 15 foundational problems for ${input.targetRole}.`,
        },
        {
          title: `Language & Runtime Deep Dive (${input.currentLevel})`,
          description: `Review core language idioms, async concurrency, and standard library data structures.`,
        },
        {
          title: "CS Core & SQL Essentials",
          description: `Revise OS processes/threads, DBMS normalization, and SQL joins/window functions.`,
        },
      ],
      resources: [
        {
          title: "LeetCode Problemset",
          platform: "LeetCode",
          type: "PRACTICE",
          url: "https://leetcode.com/problemset/",
        },
        {
          title: "MDN Web & JS Reference",
          platform: "MDN",
          type: "DOCS",
          url: "https://developer.mozilla.org/en-US/",
        },
      ],
    },
    {
      title: `Applied ${skills[1] ?? "Backend, APIs & Databases"}`,
      summary: `Translate fundamentals into production-grade APIs, database schemas, and intermediate DSA patterns.`,
      milestone: `Build and test an end-to-end service integrating ${skills[1] ?? "PostgreSQL & REST APIs"} with automated tests.`,
      tasks: [
        {
          title: `Deepen ${skills[1] ?? "Trees, Graphs & Binary Search"}`,
          description: `Solve 20 medium interview problems focusing on BFS/DFS, trees, and binary search on answer.`,
        },
        {
          title: "Relational Schema & Query Optimization",
          description: `Design indexed tables, write CTE/window queries, and inspect EXPLAIN plans.`,
        },
        {
          title: `Build Core ${input.targetRole} Feature Module`,
          description: `Implement auth, validation, and integration tests using clean layered architecture.`,
        },
      ],
      resources: [
        {
          title: "PostgreSQL Official Docs",
          platform: "PostgreSQL",
          type: "DOCS",
          url: "https://www.postgresql.org/docs/",
        },
        {
          title: "Node.js Documentation",
          platform: "Node.js",
          type: "DOCS",
          url: "https://nodejs.org/docs",
        },
      ],
    },
    {
      title: `System Design & ${skills[2] ?? "Scalable Architecture"}`,
      summary: `Design fault-tolerant distributed systems, caching layers, and tackle Dynamic Programming.`,
      milestone: `Author 3 complete HLD/LLD design docs and pass timed 60-minute OA simulations.`,
      tasks: [
        {
          title: "Dynamic Programming & Greedy Patterns",
          description: `Master 1-D/2-D DP, memoization, and interval greedy strategies.`,
        },
        {
          title: "Caching, Queues & Sharding Architecture",
          description: `Study Redis cache-aside, consistent hashing, rate limiting, and Kafka/async workers.`,
        },
        {
          title: `Focus Skill Sprint: ${skills.slice(0, 3).join(", ")}`,
          description: `Close remaining JD skill gaps with targeted hands-on mini-projects.`,
        },
      ],
      resources: [
        {
          title: "System Design Primer",
          platform: "GitHub",
          type: "ARTICLE",
          url: "https://github.com/donnemartin/system-design-primer",
        },
        {
          title: `${input.targetRole} System Design Walkthroughs`,
          platform: "YouTube",
          type: "VIDEO",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${input.targetRole} system design interview`)}`,
        },
      ],
    },
    {
      title: "Mock Interviews, Resume Polish & Final Sprint",
      summary: `Synthesize all ${input.durationWeeks} weeks into timed mock interviews, project defense, and behavioral stories.`,
      milestone: `Complete 4 full mock interviews (DSA + System Design + Behavioral) with >= 80% readiness.`,
      tasks: [
        {
          title: "Timed OA & Live Coding Simulations",
          description: `Complete 3 timed 2-problem assessments under real interview constraints.`,
        },
        {
          title: "Project Defense & STAR Behavioral Prep",
          description: `Prepare crisp architecture trade-off explanations and 6 STAR stories.`,
        },
        {
          title: "Final Weak-Spot Revision",
          description: `Review all REVISION items across DSA, CS Core, and SQL.`,
        },
      ],
      resources: [
        {
          title: "React Official Docs",
          platform: "React",
          type: "DOCS",
          url: "https://react.dev",
        },
        {
          title: `${input.targetRole} Mock Interview Prep`,
          platform: "Google Search",
          type: "COURSE",
          url: `https://www.google.com/search?q=${encodeURIComponent(`${input.targetRole} interview preparation guide`)}`,
        },
      ],
    },
  ];

  const phases: RoadmapPhase[] = templates
    .slice(0, phaseCount)
    .map((tpl, idx) => ({
      phaseNumber: idx + 1,
      weekLabel: weekLabelFor(idx),
      title: tpl.title,
      summary: tpl.summary,
      milestoneDeliverable: tpl.milestone,
      tasks: tpl.tasks.map((t, tIdx) => ({
        id: `p${idx + 1}-t${tIdx + 1}`,
        order: tIdx + 1,
        title: t.title,
        description: t.description,
        estimatedHours: taskHours,
        completed: false,
      })),
      resources: tpl.resources,
    }));

  return {
    title: `${input.targetRole} — ${input.durationWeeks}-Week Mastery Roadmap`,
    phases,
  };
}

export class RoadmapService {
  constructor(private ai: AIGateway = aiGateway) {}

  public async listRoadmaps(userId: string): Promise<LearningRoadmapDto[]> {
    const rows = await prisma.learningRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDto);
  }

  public async generateRoadmap(
    userId: string,
    input: GenerateRoadmapInput
  ): Promise<LearningRoadmapDto> {
    const focusLine = input.focusSkills?.length
      ? input.focusSkills.join(", ")
      : "Core DSA, System Design, Databases, and Role Fundamentals";

    const prompt = [
      "You are a Principal Engineering Mentor building a concrete, week-by-week career learning roadmap.",
      `Target Role: ${input.targetRole}`,
      `Timeline: ${input.durationWeeks} weeks | Study Pace: ${input.dailyHours} hrs/day | Current Level: ${input.currentLevel}`,
      `Priority Focus Skills / Gaps: ${focusLine}`,
      "",
      "Return ONLY valid JSON matching this exact schema:",
      "{",
      '  "title": "concise roadmap title",',
      '  "phases": [',
      "    {",
      '      "phaseNumber": 1,',
      '      "weekLabel": "Weeks 1–2",',
      '      "title": "Phase title",',
      '      "summary": "1-2 sentence phase goal",',
      '      "milestoneDeliverable": "concrete project or measurable outcome at end of phase",',
      '      "tasks": [',
      '        { "id": "p1-t1", "order": 1, "title": "Task title", "description": "Actionable 1-2 sentence task", "estimatedHours": 6, "completed": false }',
      "      ],",
      '      "resources": [',
      '        { "title": "Resource name", "platform": "LeetCode | React | MDN | YouTube | GitHub", "type": "DOCS | COURSE | PRACTICE | ARTICLE | VIDEO", "url": "https://..." }',
      "      ]",
      "    }",
      "  ]",
      "}",
      "",
      "CRITICAL RULES:",
      `- Divide ${input.durationWeeks} weeks into 3 to 5 sequential phases covering beginner-to-advanced progression.`,
      "- Each phase must have 3 to 4 ordered tasks with realistic estimatedHours matching dailyHours * days.",
      "- Use ONLY verified canonical URLs (e.g. https://react.dev, https://nodejs.org/docs, https://leetcode.com/problemset/, https://github.com/donnemartin/system-design-primer, https://www.postgresql.org/docs/, https://developer.mozilla.org/en-US/) or https://www.youtube.com/results?search_query=... URLs so links never 404.",
    ].join("\n");

    const result = await this.ai.completeStructured(prompt, RoadmapAISchema, {
      taskType: "AGEN",
      userId,
      rawInputText: `${input.targetRole} ${input.durationWeeks}w ${input.currentLevel} ${focusLine}`,
      fallbackFn: () => buildFallbackRoadmap(input),
    });

    const normalizedPhases = normalizePhases(result.data.phases).map((p) => ({
      ...p,
      tasks: p.tasks.map((t) => ({ ...t, completed: false })),
    }));

    const created = await prisma.learningRoadmap.create({
      data: {
        userId,
        title: result.data.title,
        targetRole: input.targetRole,
        durationWeeks: input.durationWeeks,
        dailyHours: input.dailyHours,
        currentLevel: input.currentLevel,
        phases: normalizedPhases,
      },
    });

    return toDto(created);
  }

  public async toggleTask(
    userId: string,
    roadmapId: string,
    input: ToggleRoadmapTaskInput
  ): Promise<LearningRoadmapDto> {
    const existing = await prisma.learningRoadmap.findUnique({
      where: { id: roadmapId },
    });
    if (!existing) {
      throw new NotFoundError("Learning roadmap not found");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError("You do not have access to this roadmap");
    }

    const parsed = z.array(RoadmapPhaseSchema).safeParse(existing.phases);
    const phases = parsed.success ? parsed.data : [];

    let foundTask = false;
    const updatedPhases = phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((task) => {
        if (task.id === input.taskId) {
          foundTask = true;
          return { ...task, completed: input.completed };
        }
        return task;
      }),
    }));

    if (!foundTask) {
      throw new NotFoundError(`Task '${input.taskId}' not found in roadmap`);
    }

    const updated = await prisma.learningRoadmap.update({
      where: { id: roadmapId },
      data: { phases: updatedPhases },
    });

    return toDto(updated);
  }

  public async deleteRoadmap(
    userId: string,
    roadmapId: string
  ): Promise<{ deleted: true; id: string }> {
    const existing = await prisma.learningRoadmap.findUnique({
      where: { id: roadmapId },
    });
    if (!existing) {
      throw new NotFoundError("Learning roadmap not found");
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError("You do not have access to this roadmap");
    }

    await prisma.learningRoadmap.delete({
      where: { id: roadmapId },
    });

    return { deleted: true, id: roadmapId };
  }
}

export const roadmapService = new RoadmapService();
