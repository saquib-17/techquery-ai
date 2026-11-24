import { prisma } from "../../core/database/index.js";
import type { JobDescription, Prisma } from "@prisma/client";
import type { ParsedJdData } from "./job-description.schemas.js";

export interface JobDescriptionSummary {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  structuredJson: Prisma.JsonValue;
  providerUsed: string;
  createdAt: Date;
  updatedAt: Date;
}

export class JobDescriptionRepository {
  /**
   * Creates a new job description record.
   */
  public async create(data: {
    userId: string;
    title: string;
    company?: string | null;
    rawText: string;
    structuredJson: ParsedJdData;
    providerUsed: string;
  }): Promise<JobDescription> {
    return prisma.jobDescription.create({
      data: {
        userId: data.userId,
        title: data.title,
        company: data.company ?? null,
        rawText: data.rawText,
        structuredJson: data.structuredJson as unknown as Prisma.InputJsonValue,
        providerUsed: data.providerUsed,
      },
    });
  }

  /**
   * Finds all job descriptions belonging to a user, ordered newest first.
   * Excludes rawText to optimize bandwidth and list view performance.
   */
  public async findAllByUserId(userId: string): Promise<JobDescriptionSummary[]> {
    return prisma.jobDescription.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        title: true,
        company: true,
        structuredJson: true,
        providerUsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Finds a single job description by ID strictly isolated by user ID (BOLA/IDOR protection).
   * Returns full record including rawText and structuredJson.
   */
  public async findByIdAndUserId(id: string, userId: string): Promise<JobDescription | null> {
    return prisma.jobDescription.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Updates structuredJson and providerUsed on an existing job description.
   */
  public async updateStructuredData(
    id: string,
    userId: string,
    structuredJson: ParsedJdData,
    providerUsed: string
  ): Promise<JobDescription | null> {
    const existing = await prisma.jobDescription.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) return null;

    return prisma.jobDescription.update({
      where: { id },
      data: {
        structuredJson: structuredJson as unknown as Prisma.InputJsonValue,
        providerUsed,
      },
    });
  }

  /**
   * Deletes a job description strictly isolated by user ID.
   * Returns true if deleted, false if not found.
   */
  public async deleteByIdAndUserId(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.jobDescription.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) return false;

    await prisma.jobDescription.delete({
      where: { id },
    });

    return true;
  }
}

export const jobDescriptionRepository = new JobDescriptionRepository();
