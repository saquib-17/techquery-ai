import { prisma } from "../../core/database/index.js";
import type { Resume, ProcessingStatus, ResumeAnalysis, Prisma } from "@prisma/client";

export class ResumeRepository {
  /**
   * Finds a resume by ID strictly verifying user ownership.
   */
  public async findByIdAndUser(id: string, userId: string): Promise<Resume | null> {
    return prisma.resume.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Finds all resumes for an authenticated user.
   */
  public async findByUserId(userId: string): Promise<Resume[]> {
    return prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Creates a resume record.
   * If this is the user's first resume, marks it as primary automatically.
   */
  public async createResume(data: {
    userId: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string;
    fileExtension: string;
    fileSize: number;
    storagePath: string;
    extractedText?: string | null;
    processingStatus?: ProcessingStatus;
  }): Promise<Resume> {
    return prisma.$transaction(async (tx) => {
      // Check if user already has any resumes
      const count = await tx.resume.count({
        where: { userId: data.userId },
      });

      const isPrimary = count === 0;

      return tx.resume.create({
        data: {
          ...data,
          isPrimary,
          processingStatus: data.processingStatus || "PROCESSED",
        },
      });
    });
  }

  /**
   * Sets a resume as primary inside an atomic transaction (unsets previous primary).
   */
  public async setPrimary(id: string, userId: string): Promise<Resume | null> {
    return prisma.$transaction(async (tx) => {
      // Verify existence and ownership
      const target = await tx.resume.findFirst({
        where: { id, userId },
      });

      if (!target) return null;

      // Unset previous primary for this user
      await tx.resume.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set target as primary
      return tx.resume.update({
        where: { id },
        data: { isPrimary: true },
      });
    });
  }

  /**
   * Updates extracted text and processing status.
   */
  public async updateProcessing(
    id: string,
    userId: string,
    data: {
      extractedText?: string;
      processingStatus: ProcessingStatus;
    }
  ): Promise<Resume | null> {
    const existing = await this.findByIdAndUser(id, userId);
    if (!existing) return null;

    return prisma.resume.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a resume record strictly verifying ownership.
   * If deleted resume was primary, promotes the most recent remaining resume to primary.
   */
  public async deleteResume(id: string, userId: string): Promise<Resume | null> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.resume.findFirst({
        where: { id, userId },
      });

      if (!existing) return null;

      await tx.resume.delete({
        where: { id },
      });

      // If deleted resume was primary, promote next remaining resume
      if (existing.isPrimary) {
        const nextResume = await tx.resume.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (nextResume) {
          await tx.resume.update({
            where: { id: nextResume.id },
            data: { isPrimary: true },
          });
        }
      }

      return existing;
    });
  }

  /**
   * Retrieves an ATS analysis record by resume ID.
   */
  public async findAnalysisByResumeId(resumeId: string): Promise<ResumeAnalysis | null> {
    return prisma.resumeAnalysis.findUnique({
      where: { resumeId },
    });
  }

  /**
   * Upserts an ATS analysis record for a resume.
   */
  public async upsertAnalysis(
    resumeId: string,
    data: {
      atsScore: number;
      sectionScores: Prisma.InputJsonValue;
      strengths: Prisma.InputJsonValue;
      issues: Prisma.InputJsonValue;
      improvements: Prisma.InputJsonValue;
      providerUsed: string;
    }
  ): Promise<ResumeAnalysis> {
    return prisma.resumeAnalysis.upsert({
      where: { resumeId },
      create: {
        resumeId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }

  /**
   * Updates parsed structured career graph on a resume.
   */
  public async updateParsedData(
    resumeId: string,
    parsedData: Prisma.InputJsonValue
  ): Promise<Resume> {
    return prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsedData,
      },
    });
  }
}

export const resumeRepository = new ResumeRepository();
