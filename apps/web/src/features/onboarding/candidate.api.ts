import { api, ApiClientError } from "@/lib/api";

export type OnboardingStep =
  | "PROFILE"
  | "RESUME"
  | "SKILLS"
  | "PREFERENCES"
  | "COMPLETED";

export interface CandidateProfile {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  currentRole: string | null;
  yearsOfExperience: number | null;
  highestEducation: string | null;
  university: string | null;
  graduationYear: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProfilePayload {
  fullName: string;
  phoneNumber?: string | null;
  location?: string | null;
  headline?: string | null;
  summary?: string | null;
  currentRole?: string | null;
  yearsOfExperience?: number | null;
  highestEducation?: string | null;
  university?: string | null;
  graduationYear?: number | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

export interface OnboardingState {
  id: string;
  userId: string;
  onboardingCompleted: boolean;
  onboardingStep: OnboardingStep;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOnboardingPayload {
  onboardingStep?: OnboardingStep;
  markCompleted?: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getProfileApi(): Promise<CandidateProfile | null> {
  try {
    const res = await api.get<ApiEnvelope<{ profile: CandidateProfile }>>("/profile");
    return res.data.data.profile;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createProfileApi(
  payload: SaveProfilePayload
): Promise<CandidateProfile> {
  const res = await api.post<ApiEnvelope<{ profile: CandidateProfile }>>(
    "/profile",
    payload
  );
  return res.data.data.profile;
}

export async function updateProfileApi(
  payload: Partial<SaveProfilePayload>
): Promise<CandidateProfile> {
  const res = await api.patch<ApiEnvelope<{ profile: CandidateProfile }>>(
    "/profile",
    payload
  );
  return res.data.data.profile;
}

export async function getOnboardingApi(): Promise<OnboardingState> {
  const res = await api.get<ApiEnvelope<{ onboarding: OnboardingState }>>(
    "/onboarding"
  );
  return res.data.data.onboarding;
}

export async function updateOnboardingApi(
  payload: UpdateOnboardingPayload
): Promise<OnboardingState> {
  const res = await api.patch<ApiEnvelope<{ onboarding: OnboardingState }>>(
    "/onboarding",
    payload
  );
  return res.data.data.onboarding;
}
