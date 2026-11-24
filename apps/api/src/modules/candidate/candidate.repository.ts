import { prisma } from "../../core/database/index.js";
import type { CandidateProfile, OnboardingState } from "@prisma/client";
import type { CreateProfileInput, UpdateProfileInput } from "./candidate.schemas.js";

export class CandidateRepository {
  /**
   * Finds profile by userId.
   */
  public async findProfileByUserId(userId: string): Promise<CandidateProfile | null> {
    return prisma.candidateProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Creates candidate profile enforcing unique userId constraint.
   */
  public async createProfile(userId: string, data: CreateProfileInput): Promise<CandidateProfile> {
    return prisma.candidateProfile.create({
      data: {
        userId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        location: data.location,
        headline: data.headline,
        summary: data.summary,
        currentRole: data.currentRole,
        yearsOfExperience: data.yearsOfExperience,
        highestEducation: data.highestEducation,
        university: data.university,
        graduationYear: data.graduationYear,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
      },
    });
  }

  /**
   * Updates existing profile strictly for userId.
   */
  public async updateProfile(userId: string, data: UpdateProfileInput): Promise<CandidateProfile> {
    return prisma.candidateProfile.update({
      where: { userId },
      data,
    });
  }

  /**
   * Finds onboarding state for userId.
   */
  public async findOnboardingByUserId(userId: string): Promise<OnboardingState | null> {
    return prisma.onboardingState.findUnique({
      where: { userId },
    });
  }

  /**
   * Creates or gets existing onboarding state for user.
   */
  public async getOrCreateOnboarding(userId: string): Promise<OnboardingState> {
    return prisma.onboardingState.upsert({
      where: { userId },
      create: {
        userId,
        onboardingCompleted: false,
        onboardingStep: "PROFILE",
      },
      update: {},
    });
  }

  /**
   * Updates onboarding state strictly for userId.
   */
  public async updateOnboarding(
    userId: string,
    data: {
      onboardingStep?: string;
      onboardingCompleted?: boolean;
      onboardingCompletedAt?: Date | null;
    }
  ): Promise<OnboardingState> {
    return prisma.onboardingState.upsert({
      where: { userId },
      create: {
        userId,
        onboardingStep: data.onboardingStep || "PROFILE",
        onboardingCompleted: data.onboardingCompleted ?? false,
        onboardingCompletedAt: data.onboardingCompletedAt ?? null,
      },
      update: data,
    });
  }
}

export const candidateRepository = new CandidateRepository();
