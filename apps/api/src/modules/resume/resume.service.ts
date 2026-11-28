import { randomUUID } from "node:crypto";
import path from "node:path";
import { resumeRepository, ResumeRepository } from "./resume.repository.js";
import { candidateRepository, CandidateRepository } from "../candidate/candidate.repository.js";
import { storageService, IStorageService } from "../../core/storage/storage.service.js";
import { FileValidator } from "../../core/storage/file-validator.js";
import { DocumentExtractor } from "../../core/storage/document-extractor.js";
import { NotFoundError, BadRequestError } from "../../core/errors/AppError.js";
import type { Resume, ResumeAnalysis } from "@prisma/client";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { createGroqStructured } from "../../lib/groqClient.js";
import { PromptRegistry } from "../../core/ai/prompt.registry.js";
import {
  ParsedResumeDataSchema,
  ATSAuditResponseSchema,
  type ParsedResumeData,
  type ATSAuditResponse,
} from "./resume-intelligence.schemas.js";
import {
  deterministicParseResume,
  deterministicAtsAudit,
} from "./resume-intelligence.fallback.js";
import { usageService } from "../usage/usage.service.js";
import { activityService } from "../dashboard/activity.service.js";

// Public sanitized resume projection that NEVER leaks storagePath or internal server details
export interface PublicResume {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  processingStatus: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ResumeService {
  constructor(
    private repo: ResumeRepository = resumeRepository,
    private storage: IStorageService = storageService,
    private candidateRepo: CandidateRepository = candidateRepository,
    _ai: AIGateway = aiGateway
  ) { }

  public toPublicResume(resume: Resume): PublicResume {
    return {
      id: resume.id,
      originalFileName: resume.originalFileName,
      mimeType: resume.mimeType,
      fileExtension: resume.fileExtension,
      fileSize: resume.fileSize,
      processingStatus: resume.processingStatus,
      isPrimary: resume.isPrimary,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };
  }

  /**
   * Uploads and stores a new resume for the authenticated user.
   */
  public async uploadResume(
    userId: string,
    fileBuffer: Buffer,
    originalName: string
  ): Promise<PublicResume> {
    // 0. Quota check (Free tier: max 3 resumes, Pro tier: max 10)
    await usageService.assertWithinQuota(userId, "resumes");

    // 1. Sanitize original filename (remove directory components, control characters)
    const sanitizedOriginalName = path.basename(originalName).trim();
    if (!sanitizedOriginalName) {
      throw new BadRequestError("Invalid file name", "INVALID_FILENAME");
    }

    // 2. Validate magic bytes and format
    const validation = FileValidator.validateBuffer(fileBuffer, sanitizedOriginalName);

    // 3. Extract text synchronously before persistence to validate document integrity
    // Fails fast with 400 Bad Request if file is corrupted, password-protected, unreadable, or a non-DOCX ZIP archive
    const extractedText = await DocumentExtractor.extractText(fileBuffer, validation.extension);

    // 4. Generate cryptographically unique stored filename (never use original filename)
    const storedFileName = `${randomUUID()}.${validation.extension}`;

    // 5. Save to local storage
    const saved = await this.storage.save(storedFileName, fileBuffer);

    // 6. Create database record; if DB fails, rollback stored file
    let resumeRecord: Resume;
    try {
      resumeRecord = await this.repo.createResume({
        userId,
        originalFileName: sanitizedOriginalName,
        storedFileName,
        mimeType: validation.mimeType,
        fileExtension: validation.extension,
        fileSize: saved.fileSize,
        storagePath: saved.storagePath,
        extractedText,
        processingStatus: "PROCESSED",
      });

      // Update onboarding progress if on RESUME step
      const onboarding = await this.candidateRepo.findOnboardingByUserId(userId);
      if (onboarding && onboarding.onboardingStep === "RESUME") {
        await this.candidateRepo.updateOnboarding(userId, { onboardingStep: "SKILLS" });
      }

      await activityService.logActivity(userId, "RESUME_UPLOADED", {
        resumeId: resumeRecord.id,
        fileName: sanitizedOriginalName,
      });
    } catch (dbErr) {
      // Rollback physical file on DB failure
      await this.storage.delete(storedFileName).catch(() => { });
      throw dbErr;
    }

    return this.toPublicResume(resumeRecord);
  }

  public async listResumes(userId: string): Promise<PublicResume[]> {
    const resumes = await this.repo.findByUserId(userId);
    return resumes.map((r) => this.toPublicResume(r));
  }

  public async getResume(id: string, userId: string): Promise<PublicResume> {
    const resume = await this.repo.findByIdAndUser(id, userId);
    if (!resume) {
      throw new NotFoundError("Resume not found");
    }
    return this.toPublicResume(resume);
  }

  public async getResumeForDownload(
    id: string,
    userId: string
  ): Promise<{ buffer: Buffer; mimeType: string; originalFileName: string }> {
    const resume = await this.repo.findByIdAndUser(id, userId);
    if (!resume) {
      throw new NotFoundError("Resume not found");
    }

    const buffer = await this.storage.read(resume.storedFileName);
    return {
      buffer,
      mimeType: resume.mimeType,
      originalFileName: resume.originalFileName,
    };
  }

  public async setPrimaryResume(id: string, userId: string): Promise<PublicResume> {
    const updated = await this.repo.setPrimary(id, userId);
    if (!updated) {
      throw new NotFoundError("Resume not found");
    }
    return this.toPublicResume(updated);
  }

  public async deleteResume(id: string, userId: string): Promise<void> {
    const deleted = await this.repo.deleteResume(id, userId);
    if (!deleted) {
      throw new NotFoundError("Resume not found");
    }

    // Clean up physical storage file
    await this.storage.delete(deleted.storedFileName);
  }

  /**
   * Executes AI-driven career extraction (RESUME_PARSE) and ATS quality audit (ATS_AUDIT).
   */
  public async analyzeResume(
    userId: string,
    resumeId: string
  ): Promise<{ analysis: ResumeAnalysis; parsedData: ParsedResumeData }> {
    const resume = await this.repo.findByIdAndUser(resumeId, userId);
    if (!resume) {
      throw new NotFoundError("Resume not found", "RESUME_NOT_FOUND");
    }

    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
      throw new BadRequestError(
        "Resume has not been extracted or contains no readable text",
        "UNREADABLE_RESUME"
      );
    }

    const resumeText = resume.extractedText;

    // 1. Structured career intelligence extraction
    const parsePrompt = PromptRegistry.buildResumeParsePrompt(resumeText);
    const parseResult = await createGroqStructured<ParsedResumeData>(
      ParsedResumeDataSchema,
      {
        prompt: parsePrompt,
        chainType: "heavy",
        taskType: "RESUME_PARSE",
        userId,
        rawInputText: resumeText,
        fallbackFn: (raw = "") => deterministicParseResume(raw || resumeText),
      }
    );

    // 2. ATS Quality audit and improvement scoring
    const atsPrompt = PromptRegistry.buildAtsAuditPrompt(resumeText);
    const atsResult = await createGroqStructured<ATSAuditResponse>(
      ATSAuditResponseSchema,
      {
        prompt: atsPrompt,
        chainType: "heavy",
        taskType: "ATS_AUDIT",
        userId,
        rawInputText: resumeText,
        fallbackFn: (raw = "") => deterministicAtsAudit(raw || resumeText),
      }
    );

    // 3. Persist structured graph on Resume and upsert ResumeAnalysis
    await this.repo.updateParsedData(resumeId, parseResult.data as any);

    const analysis = await this.repo.upsertAnalysis(resumeId, {
      atsScore: atsResult.data.atsScore,
      sectionScores: atsResult.data.sectionScores as any,
      strengths: atsResult.data.strengths as any,
      issues: atsResult.data.issues as any,
      improvements: atsResult.data.improvements as any,
      providerUsed: atsResult.providerUsed,
    });

    return {
      analysis,
      parsedData: parseResult.data,
    };
  }

  /**
   * Retrieves ATS quality audit for a resume owned by authenticated user.
   */
  public async getResumeAnalysis(userId: string, resumeId: string): Promise<ResumeAnalysis> {
    const resume = await this.repo.findByIdAndUser(resumeId, userId);
    if (!resume) {
      throw new NotFoundError("Resume not found", "RESUME_NOT_FOUND");
    }

    const analysis = await this.repo.findAnalysisByResumeId(resumeId);
    if (!analysis) {
      throw new NotFoundError(
        "Resume has not been analyzed yet. Please run analysis first.",
        "ANALYSIS_NOT_FOUND"
      );
    }

    return analysis;
  }

  /**
   * Retrieves parsed career graph for a resume owned by authenticated user.
   */
  public async getParsedResumeData(userId: string, resumeId: string): Promise<ParsedResumeData> {
    const resume = await this.repo.findByIdAndUser(resumeId, userId);
    if (!resume) {
      throw new NotFoundError("Resume not found", "RESUME_NOT_FOUND");
    }

    if (!resume.parsedData) {
      throw new NotFoundError(
        "Parsed resume data is not available. Please run analysis first.",
        "PARSED_DATA_NOT_FOUND"
      );
    }

    return resume.parsedData as unknown as ParsedResumeData;
  }
}

export const resumeService = new ResumeService();
