import type {
  AssessmentSession,
  AssessmentSessionProblem,
  CodingProblem,
  Prisma,
} from "@prisma/client";
import type {
  AssessmentDraftEntry,
  AssessmentProblemSlotDto,
  AssessmentSessionDto,
  AssessmentStatus,
  DifficultyPreset,
  DsaPattern,
  ProblemDifficulty,
  SaveAssessmentDraftInput,
  SessionMode,
  StartAssessmentInput,
} from "@techquery/shared";
import { prisma } from "../../core/database/index.js";
import {
  AppError,
  BadRequestError,
  NotFoundError,
} from "../../core/errors/AppError.js";
import { ensureCuratedProblemsSeeded } from "../coding/curatedProblems.js";
import { codingService, toCodingProblemDto } from "../coding/coding.service.js";

type SessionWithProblems = AssessmentSession & {
  problems: Array<AssessmentSessionProblem & { problem: CodingProblem }>;
};

const SESSION_INCLUDE = {
  problems: {
    orderBy: { orderIndex: "asc" as const },
    include: { problem: true },
  },
};

export class AssessmentService {
  /**
   * Synchronizes server-side timer expiration for TIMED sessions and serializes to DTO.
   */
  public async syncAndSerializeSession(
    session: SessionWithProblems
  ): Promise<AssessmentSessionDto> {
    let currentStatus = session.status;
    let remainingSeconds: number | null = null;

    if (session.mode === "TIMED" && session.expiresAt) {
      if (currentStatus === "IN_PROGRESS") {
        const diffSec = Math.floor(
          (session.expiresAt.getTime() - Date.now()) / 1000
        );
        if (diffSec <= 0) {
          remainingSeconds = 0;
          currentStatus = "EXPIRED";
          await prisma.assessmentSession.update({
            where: { id: session.id },
            data: { status: "EXPIRED", completedAt: session.expiresAt },
          });
        } else {
          remainingSeconds = diffSec;
        }
      } else {
        remainingSeconds = 0;
      }
    }

    const problems: AssessmentProblemSlotDto[] = session.problems.map((slot) => ({
      orderIndex: slot.orderIndex,
      maxPoints: 100,
      earnedPoints: slot.earnedPoints,
      solved: slot.solved,
      problem: toCodingProblemDto(slot.problem),
    }));

    const drafts =
      session.draftsJson &&
      typeof session.draftsJson === "object" &&
      !Array.isArray(session.draftsJson)
        ? (session.draftsJson as unknown as Record<string, AssessmentDraftEntry>)
        : {};

    return {
      id: session.id,
      title: session.title,
      mode: session.mode as SessionMode,
      difficultyPreset: session.difficultyPreset as DifficultyPreset,
      status: currentStatus as AssessmentStatus,
      durationMinutes:
        session.mode === "UNTIMED" ? null : session.durationMinutes,
      startedAt: session.startedAt.toISOString(),
      expiresAt:
        session.mode === "UNTIMED" || !session.expiresAt
          ? null
          : session.expiresAt.toISOString(),
      remainingSeconds,
      totalScore: session.totalScore,
      maxTotalScore: problems.length * 100,
      problems,
      drafts,
    };
  }

  public async getActiveSession(
    userId: string
  ): Promise<AssessmentSessionDto | null> {
    const active = await prisma.assessmentSession.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      include: SESSION_INCLUDE,
    });

    if (!active) {
      return null;
    }

    const dto = await this.syncAndSerializeSession(active);
    if (dto.status !== "IN_PROGRESS") {
      return null;
    }
    return dto;
  }

  public async startSession(
    userId: string,
    input: StartAssessmentInput
  ): Promise<AssessmentSessionDto> {
    const existingActive = await this.getActiveSession(userId);
    if (existingActive) {
      throw new AppError(
        "An active coding session is already in progress. Resume, finish, or cancel it first.",
        409,
        "ACTIVE_SESSION_EXISTS"
      );
    }

    await ensureCuratedProblemsSeeded();

    const difficulties = this.resolveDifficultySlots(
      input.difficultyPreset,
      input.problemCount,
      input.singleDifficulty
    );
    const focusPattern: DsaPattern = input.focusPattern || "ALL_PATTERNS";

    const selectedProblems: CodingProblem[] = [];
    const usedIds = new Set<string>();
    const usedTitles = new Set<string>();

    for (const diff of difficulties) {
      const where: Prisma.CodingProblemWhereInput = {
        difficulty: diff,
        id: { notIn: Array.from(usedIds) },
        title: { notIn: Array.from(usedTitles) },
        NOT: [
          { title: { contains: "(Variant" } },
          { title: { contains: "(Practice" } },
        ],
      };
      if (focusPattern !== "ALL_PATTERNS") {
        where.pattern = focusPattern;
      }

      const candidates = await prisma.codingProblem.findMany({
        where,
        take: 12,
      });

      let chosen: CodingProblem | null =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]!
          : null;

      // Fallback to any distinct curated problem of the same difficulty if pattern-filtered pool is exhausted
      if (!chosen && focusPattern !== "ALL_PATTERNS") {
        const diffCandidates = await prisma.codingProblem.findMany({
          where: {
            difficulty: diff,
            id: { notIn: Array.from(usedIds) },
            title: { notIn: Array.from(usedTitles) },
            NOT: [
              { title: { contains: "(Variant" } },
              { title: { contains: "(Practice" } },
            ],
          },
          take: 12,
        });
        if (diffCandidates.length > 0) {
          chosen =
            diffCandidates[Math.floor(Math.random() * diffCandidates.length)]!;
        }
      }

      if (!chosen) {
        const generated = await codingService.generateProblem(userId, {
          difficulty: diff,
          pattern: focusPattern,
        });
        chosen = await prisma.codingProblem.findUnique({
          where: { id: generated.id },
        });
      }

      if (chosen && !usedIds.has(chosen.id) && !usedTitles.has(chosen.title)) {
        usedIds.add(chosen.id);
        usedTitles.add(chosen.title);
        selectedProblems.push(chosen);
      }
    }

    const startedAt = new Date();
    const isTimed = input.mode === "TIMED";
    const durationMinutes = isTimed ? (input.durationMinutes ?? 60) : null;
    const expiresAt =
      isTimed && durationMinutes !== null
        ? new Date(startedAt.getTime() + durationMinutes * 60_000)
        : null;

    const modeLabel = isTimed ? `Timed OA (${durationMinutes}m)` : "Untimed Practice";
    const patternLabel =
      focusPattern === "ALL_PATTERNS" ? "Mixed Patterns" : focusPattern;
    const title = `${modeLabel} · ${patternLabel}`;

    const created = await prisma.assessmentSession.create({
      data: {
        userId,
        title,
        mode: input.mode,
        difficultyPreset: input.difficultyPreset,
        status: "IN_PROGRESS",
        durationMinutes,
        startedAt,
        expiresAt,
        draftsJson: {},
        problems: {
          create: selectedProblems.map((p, idx) => ({
            problemId: p.id,
            orderIndex: idx + 1,
            maxPoints: 100,
            earnedPoints: 0,
            solved: false,
          })),
        },
      },
      include: SESSION_INCLUDE,
    });

    return this.syncAndSerializeSession(created);
  }

  public async getHistory(userId: string): Promise<AssessmentSessionDto[]> {
    // Sync any stale IN_PROGRESS session before querying history
    await this.getActiveSession(userId);

    const rows = await prisma.assessmentSession.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "EXPIRED", "CANCELLED"] },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: SESSION_INCLUDE,
    });

    const results: AssessmentSessionDto[] = [];
    for (const row of rows) {
      results.push(await this.syncAndSerializeSession(row));
    }
    return results;
  }

  public async getSessionById(
    userId: string,
    sessionId: string
  ): Promise<AssessmentSessionDto> {
    const row = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_INCLUDE,
    });
    if (!row) {
      throw new NotFoundError(
        "Assessment session not found",
        "ASSESSMENT_NOT_FOUND"
      );
    }
    return this.syncAndSerializeSession(row);
  }

  public async saveDraft(
    userId: string,
    sessionId: string,
    input: SaveAssessmentDraftInput
  ): Promise<AssessmentSessionDto> {
    const row = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_INCLUDE,
    });
    if (!row) {
      throw new NotFoundError(
        "Assessment session not found",
        "ASSESSMENT_NOT_FOUND"
      );
    }

    const synced = await this.syncAndSerializeSession(row);
    if (synced.status !== "IN_PROGRESS") {
      throw new BadRequestError(
        `Cannot save draft: session is ${synced.status}`,
        "ASSESSMENT_NOT_ACTIVE"
      );
    }

    const hasProblem = row.problems.some((p) => p.problemId === input.problemId);
    if (!hasProblem) {
      throw new NotFoundError(
        "Problem does not belong to this assessment session",
        "PROBLEM_NOT_IN_SESSION"
      );
    }

    const updatedDrafts: Record<string, AssessmentDraftEntry> = {
      ...synced.drafts,
      [input.problemId]: {
        language: input.language,
        code: input.code,
        updatedAt: new Date().toISOString(),
      },
    };

    const updated = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        draftsJson: updatedDrafts as unknown as Prisma.InputJsonValue,
      },
      include: SESSION_INCLUDE,
    });

    return this.syncAndSerializeSession(updated);
  }

  public async finishSession(
    userId: string,
    sessionId: string
  ): Promise<AssessmentSessionDto> {
    const row = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_INCLUDE,
    });
    if (!row) {
      throw new NotFoundError(
        "Assessment session not found",
        "ASSESSMENT_NOT_FOUND"
      );
    }

    const synced = await this.syncAndSerializeSession(row);
    if (synced.status !== "IN_PROGRESS") {
      return synced;
    }

    const updated = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: SESSION_INCLUDE,
    });

    return this.syncAndSerializeSession(updated);
  }

  public async cancelSession(
    userId: string,
    sessionId: string
  ): Promise<AssessmentSessionDto> {
    const row = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: SESSION_INCLUDE,
    });
    if (!row) {
      throw new NotFoundError(
        "Assessment session not found",
        "ASSESSMENT_NOT_FOUND"
      );
    }

    const synced = await this.syncAndSerializeSession(row);
    if (synced.status !== "IN_PROGRESS") {
      return synced;
    }

    const updated = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
      include: SESSION_INCLUDE,
    });

    return this.syncAndSerializeSession(updated);
  }

  public async deleteSession(
    userId: string,
    sessionId: string
  ): Promise<{ deleted: true; id: string }> {
    const existing = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundError(
        "Assessment session not found",
        "ASSESSMENT_NOT_FOUND"
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.codingSubmission.deleteMany({
        where: { assessmentSessionId: sessionId, userId },
      });
      await tx.assessmentSessionProblem.deleteMany({
        where: { sessionId },
      });
      await tx.assessmentSession.delete({
        where: { id: sessionId },
      });
    });

    return { deleted: true, id: sessionId };
  }

  public async clearHistory(
    userId: string
  ): Promise<{ deletedCount: number }> {
    const staleSessions = await prisma.assessmentSession.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "EXPIRED", "CANCELLED"] },
      },
      select: { id: true },
    });

    const ids = staleSessions.map((s) => s.id);
    if (ids.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.codingSubmission.deleteMany({
        where: { assessmentSessionId: { in: ids }, userId },
      });
      await tx.assessmentSessionProblem.deleteMany({
        where: { sessionId: { in: ids } },
      });
      return tx.assessmentSession.deleteMany({
        where: { id: { in: ids }, userId },
      });
    });

    return { deletedCount: result.count };
  }

  private resolveDifficultySlots(
    preset: DifficultyPreset,
    count: number,
    singleDifficulty?: ProblemDifficulty
  ): ProblemDifficulty[] {
    if (preset === "EASY_ONLY") {
      return Array.from({ length: count }, () => "EASY");
    }
    if (preset === "SINGLE_FOCUS") {
      const target = singleDifficulty || "MEDIUM";
      return Array.from({ length: count }, () => target);
    }
    if (preset === "MIXED_WITH_HARD") {
      if (count === 1) return ["MEDIUM"];
      if (count === 2) return ["EASY", "MEDIUM"];
      return ["EASY", "MEDIUM", "HARD"];
    }
    // EASY_TO_MEDIUM
    if (count === 1) return ["EASY"];
    return ["EASY", ...Array.from({ length: count - 1 }, () => "MEDIUM" as const)];
  }
}

export const assessmentService = new AssessmentService();
