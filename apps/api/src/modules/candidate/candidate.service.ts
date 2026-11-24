import { candidateRepository, CandidateRepository } from "./candidate.repository.js";
import { NotFoundError, ConflictError, BadRequestError } from "../../core/errors/AppError.js";
import type { CandidateProfile, OnboardingState } from "@prisma/client";
import type { CreateProfileInput, UpdateProfileInput, UpdateOnboardingInput } from "./candidate.schemas.js";

export class CandidateService {
  constructor(private repo: CandidateRepository = candidateRepository) {}

  public async getProfile(userId: string): Promise<CandidateProfile> {
    const profile = await this.repo.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Candidate profile not found");
    }
    return profile;
  }

  public async createProfile(userId: string, input: CreateProfileInput): Promise<CandidateProfile> {
    const existing = await this.repo.findProfileByUserId(userId);
    if (existing) {
      throw new ConflictError("Candidate profile already exists for this user", "PROFILE_ALREADY_EXISTS");
    }

    const profile = await this.repo.createProfile(userId, input);

    // Update onboarding progress automatically if on initial profile step
    const onboarding = await this.repo.findOnboardingByUserId(userId);
    if (!onboarding || onboarding.onboardingStep === "PROFILE") {
      await this.repo.updateOnboarding(userId, { onboardingStep: "RESUME" });
    }

    return profile;
  }

  public async updateProfile(userId: string, input: UpdateProfileInput): Promise<CandidateProfile> {
    const existing = await this.repo.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError("Candidate profile not found");
    }

    return this.repo.updateProfile(userId, input);
  }

  public async getOnboarding(userId: string): Promise<OnboardingState> {
    return this.repo.getOrCreateOnboarding(userId);
  }

  public async updateOnboarding(userId: string, input: UpdateOnboardingInput): Promise<OnboardingState> {
    const profile = await this.repo.findProfileByUserId(userId);

    // If user attempts to mark onboarding as completed, validate that profile exists and has required info
    if (input.markCompleted) {
      if (!profile || !profile.fullName || profile.fullName.trim().length === 0) {
        throw new BadRequestError("Cannot complete onboarding without completing the profile", "PROFILE_INCOMPLETE");
      }

      return this.repo.updateOnboarding(userId, {
        onboardingStep: "COMPLETED",
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      });
    }

    return this.repo.updateOnboarding(userId, {
      onboardingStep: input.onboardingStep,
    });
  }
}

export const candidateService = new CandidateService();
