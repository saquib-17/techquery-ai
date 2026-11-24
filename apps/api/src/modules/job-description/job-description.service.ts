import {
  jobDescriptionRepository,
  JobDescriptionRepository,
  type JobDescriptionSummary,
} from "./job-description.repository.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import {
  ParsedJdDataSchema,
  CreateJobDescriptionSchema,
  type CreateJobDescriptionInput,
  type ParsedJdData,
} from "./job-description.schemas.js";
import { deterministicParseJd } from "./job-description.fallback.js";
import { NotFoundError } from "../../core/errors/AppError.js";
import type { JobDescription } from "@prisma/client";

export class JobDescriptionService {
  constructor(
    private repo: JobDescriptionRepository = jobDescriptionRepository,
    private ai: AIGateway = aiGateway
  ) {}

  /**
   * Creates and decomposes a job description using AI Gateway or deterministic fallback.
   */
  public async createJobDescription(
    userId: string,
    input: CreateJobDescriptionInput
  ): Promise<JobDescription> {
    const validated = CreateJobDescriptionSchema.parse(input);

    const prompt = PromptRegistry.buildJdDecomposePrompt(validated.rawText);

    const aiResult = await this.ai.completeStructured<ParsedJdData>(
      prompt,
      ParsedJdDataSchema,
      {
        taskType: "JD_DECOMPOSE",
        userId,
        rawInputText: validated.rawText,
        fallbackFn: (text) => deterministicParseJd(validated.title, text),
      }
    );

    return this.repo.create({
      userId,
      title: validated.title,
      company: validated.company ?? null,
      rawText: validated.rawText,
      structuredJson: aiResult.data,
      providerUsed: aiResult.providerUsed,
    });
  }

  /**
   * Lists all job descriptions owned by the user.
   */
  public async listJobDescriptions(userId: string): Promise<JobDescriptionSummary[]> {
    return this.repo.findAllByUserId(userId);
  }

  /**
   * Retrieves a single job description by ID ensuring ownership (BOLA/IDOR protection).
   */
  public async getJobDescriptionById(userId: string, id: string): Promise<JobDescription> {
    const jd = await this.repo.findByIdAndUserId(id, userId);
    if (!jd) {
      throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
    }
    return jd;
  }

  /**
   * Re-analyzes an existing job description on stored rawText.
   */
  public async reanalyzeJobDescription(userId: string, id: string): Promise<JobDescription> {
    const jd = await this.repo.findByIdAndUserId(id, userId);
    if (!jd) {
      throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
    }

    const prompt = PromptRegistry.buildJdDecomposePrompt(jd.rawText);

    const aiResult = await this.ai.completeStructured<ParsedJdData>(
      prompt,
      ParsedJdDataSchema,
      {
        taskType: "JD_DECOMPOSE",
        userId,
        rawInputText: jd.rawText,
        fallbackFn: (text) => deterministicParseJd(jd.title, text),
      }
    );

    const updated = await this.repo.updateStructuredData(
      id,
      userId,
      aiResult.data,
      aiResult.providerUsed
    );

    if (!updated) {
      throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
    }

    return updated;
  }

  /**
   * Deletes a job description ensuring ownership (BOLA/IDOR protection).
   */
  public async deleteJobDescription(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.repo.deleteByIdAndUserId(id, userId);
    if (!deleted) {
      throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
    }
    return { success: true, message: "Job description deleted successfully" };
  }
}

export const jobDescriptionService = new JobDescriptionService();
