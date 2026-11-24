import {
  matchingRepository,
  MatchingRepository,
  type JobMatchWithMetadata,
} from "./matching.repository.js";
import { prisma } from "../../core/database/index.js";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import {
  calculateDeterministicMatch,
  type DeterministicMatchResult,
} from "./matching.calculator.js";
import { deterministicQualitativeAnalysis } from "./matching.fallback.js";
import {
  MatchQualitativeAnalysisSchema,
  type MatchQualitativeAnalysis,
} from "./matching.schemas.js";
import { NotFoundError, BadRequestError } from "../../core/errors/AppError.js";
import { logger } from "../../core/logger/index.js";
import { activityService } from "../dashboard/activity.service.js";

export class MatchingService {
  constructor(
    private repo: MatchingRepository = matchingRepository,
    private ai: AIGateway = aiGateway
  ) { }

  /**
   * Evaluates match between candidate's resume and job description.
   * Enforces strict tenant ownership on both documents.
   */
  public async evaluateMatch(
    userId: string,
    resumeId: string,
    jdId: string
  ): Promise<JobMatchWithMetadata> {
    // 1. Verify Resume ownership & existence (BOLA/IDOR protection)
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new NotFoundError("Resume not found", "RESUME_NOT_FOUND");
    }

    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
      throw new BadRequestError(
        "Resume content is unreadable or text could not be extracted",
        "UNREADABLE_RESUME"
      );
    }

    // 2. Verify Job Description ownership & existence (BOLA/IDOR protection)
    const jobDescription = await prisma.jobDescription.findFirst({
      where: { id: jdId, userId },
    });

    if (!jobDescription) {
      throw new NotFoundError("Job description not found", "JD_NOT_FOUND");
    }

    // 3. Optional: retrieve candidate profile declared years of experience
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: { yearsOfExperience: true },
    });

    // 4. Compute deterministic score & skill gap analysis
    const calcResult: DeterministicMatchResult = calculateDeterministicMatch(
      resume,
      jobDescription,
      candidateProfile?.yearsOfExperience
    );

    // 5. Build prompt for AI qualitative analysis
    const prompt = PromptRegistry.buildMatchAnalysisPrompt({
      resumeText: resume.extractedText,
      jdTitle: jobDescription.title,
      jdCompany: jobDescription.company,
      jdText: jobDescription.rawText,
      matchedSkills: calcResult.matchedSkills,
      missingSkills: calcResult.missingSkills,
      scoreBreakdown: calcResult.scoreBreakdown,
      overallMatchScore: calcResult.matchScore,
    });

    // 6. Enrich with AI qualitative evaluation or deterministic fallback
    let qualitativeAnalysis: MatchQualitativeAnalysis;
    let providerUsed = "FALLBACK";

    try {
      const aiResult = await this.ai.completeStructured<MatchQualitativeAnalysis>(
        prompt,
        MatchQualitativeAnalysisSchema,
        {
          taskType: "MATCH_ANALYSIS",
          userId,
          rawInputText: `${resume.extractedText}\n${jobDescription.rawText}`,
          fallbackFn: () =>
            deterministicQualitativeAnalysis(
              calcResult,
              jobDescription.title,
              jobDescription.company
            ),
        }
      );
      qualitativeAnalysis = aiResult.data;
      providerUsed = aiResult.providerUsed;
    } catch (err) {
      logger.warn(
        { err, userId, resumeId, jdId },
        "AI qualitative evaluation threw an error; applying deterministic fallback"
      );
      qualitativeAnalysis = deterministicQualitativeAnalysis(
        calcResult,
        jobDescription.title,
        jobDescription.company
      );
      providerUsed = "FALLBACK";
    }

    // 7. Upsert record in database
    const match = await this.repo.upsertMatch({
      userId,
      resumeId,
      jdId,
      matchScore: calcResult.matchScore,
      scoreBreakdown: calcResult.scoreBreakdown,
      matchedSkills: calcResult.matchedSkills,
      missingSkills: calcResult.missingSkills,
      analysisJson: qualitativeAnalysis,
      providerUsed,
    });

    await activityService.logActivity(userId, "MATCH_EVALUATED", {
      matchId: match.id,
      resumeId,
      jdId,
      overallScore: calcResult.matchScore,
    });

    return match;
  }

  /**
   * Lists match history for authenticated user.
   */
  public async listMatches(userId: string): Promise<JobMatchWithMetadata[]> {
    return this.repo.findAllByUserId(userId);
  }

  /**
   * Retrieves single match report verifying user ownership.
   */
  public async getMatchById(userId: string, id: string): Promise<JobMatchWithMetadata> {
    const match = await this.repo.findByIdAndUserId(id, userId);
    if (!match) {
      throw new NotFoundError("Match report not found", "MATCH_NOT_FOUND");
    }
    return match;
  }

  /**
   * Deletes a match report verifying user ownership.
   */
  public async deleteMatch(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.repo.deleteByIdAndUserId(id, userId);
    if (!deleted) {
      throw new NotFoundError("Match report not found", "MATCH_NOT_FOUND");
    }
    return { success: true, message: "Match report deleted successfully" };
  }
}

export const matchingService = new MatchingService();

