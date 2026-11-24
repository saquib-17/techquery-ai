import { prisma } from "../../core/database/index.js";
import type { JobMatch, Prisma } from "@prisma/client";
import type {
  ScoreBreakdown,
  MissingSkillItem,
  MatchQualitativeAnalysis,
} from "./matching.schemas.js";

export interface JobMatchWithMetadata extends JobMatch {
  resume?: {
    id: string;
    originalFileName: string;
    isPrimary: boolean;
    fileExtension?: string;
  };
  jobDescription?: {
    id: string;
    title: string;
    company: string | null;
    rawText?: string;
  };
}

export class MatchingRepository {
  /**
   * Upserts a JobMatch record for a specific (resumeId, jdId) pair.
   */
  public async upsertMatch(data: {
    userId: string;
    resumeId: string;
    jdId: string;
    matchScore: number;
    scoreBreakdown: ScoreBreakdown;
    matchedSkills: string[];
    missingSkills: MissingSkillItem[];
    analysisJson: MatchQualitativeAnalysis;
    providerUsed: string;
  }): Promise<JobMatchWithMetadata> {
    return prisma.jobMatch.upsert({
      where: {
        resumeId_jdId: {
          resumeId: data.resumeId,
          jdId: data.jdId,
        },
      },
      update: {
        matchScore: data.matchScore,
        scoreBreakdown: data.scoreBreakdown as unknown as Prisma.InputJsonValue,
        matchedSkills: data.matchedSkills as unknown as Prisma.InputJsonValue,
        missingSkills: data.missingSkills as unknown as Prisma.InputJsonValue,
        analysisJson: data.analysisJson as unknown as Prisma.InputJsonValue,
        providerUsed: data.providerUsed,
      },
      create: {
        userId: data.userId,
        resumeId: data.resumeId,
        jdId: data.jdId,
        matchScore: data.matchScore,
        scoreBreakdown: data.scoreBreakdown as unknown as Prisma.InputJsonValue,
        matchedSkills: data.matchedSkills as unknown as Prisma.InputJsonValue,
        missingSkills: data.missingSkills as unknown as Prisma.InputJsonValue,
        analysisJson: data.analysisJson as unknown as Prisma.InputJsonValue,
        providerUsed: data.providerUsed,
      },
      include: {
        resume: {
          select: {
            id: true,
            originalFileName: true,
            isPrimary: true,
          },
        },
        jobDescription: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
    });
  }

  /**
   * Finds all matches for a user, ordered newest first.
   */
  public async findAllByUserId(userId: string): Promise<JobMatchWithMetadata[]> {
    return prisma.jobMatch.findMany({
      where: { userId },
      include: {
        resume: {
          select: {
            id: true,
            originalFileName: true,
            isPrimary: true,
          },
        },
        jobDescription: {
          select: {
            id: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Finds a single match by ID strictly isolated by user ID (BOLA/IDOR protection).
   */
  public async findByIdAndUserId(id: string, userId: string): Promise<JobMatchWithMetadata | null> {
    return prisma.jobMatch.findFirst({
      where: { id, userId },
      include: {
        resume: {
          select: {
            id: true,
            originalFileName: true,
            fileExtension: true,
            isPrimary: true,
          },
        },
        jobDescription: {
          select: {
            id: true,
            title: true,
            company: true,
            rawText: true,
          },
        },
      },
    });
  }

  /**
   * Deletes a match strictly isolated by user ID.
   */
  public async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.jobMatch.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) return false;

    await prisma.jobMatch.delete({
      where: { id },
    });

    return true;
  }
}

export const matchingRepository = new MatchingRepository();
