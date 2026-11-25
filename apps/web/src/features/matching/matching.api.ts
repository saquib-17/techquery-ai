import { api } from "@/lib/api";

export type MissingSkillImportance = "HIGH" | "MEDIUM" | "LOW";

export interface MissingSkillItem {
  skill: string;
  importance: MissingSkillImportance;
  category: string;
}

export interface ScoreBreakdown {
  mustHaveSkillsScore: number;
  niceToHaveSkillsScore: number;
  experienceScore: number;
  domainScore: number;
}

export interface MatchQualitativeAnalysis {
  experienceMatch: string;
  projectRelevance: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface JobMatchItem {
  id: string;
  userId: string;
  resumeId: string;
  jdId: string;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: MissingSkillItem[];
  analysisJson: MatchQualitativeAnalysis;
  providerUsed?: string;
  createdAt: string;
  updatedAt?: string;
  resume?: {
    id: string;
    originalFileName: string;
  };
  jobDescription?: {
    id: string;
    title: string;
    company: string | null;
  };
}

export interface CreateMatchPayload {
  resumeId: string;
  jdId: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getMatchesApi(): Promise<JobMatchItem[]> {
  const res = await api.get<ApiEnvelope<{ matches: JobMatchItem[] }>>("/matches");
  return res.data.data.matches;
}

export async function evaluateMatchApi(
  payload: CreateMatchPayload
): Promise<JobMatchItem> {
  const res = await api.post<ApiEnvelope<{ match: JobMatchItem }>>(
    "/matches",
    payload
  );
  return res.data.data.match;
}

export async function deleteMatchApi(
  id: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<ApiEnvelope<{ success: boolean; message: string }>>(
    `/matches/${id}`
  );
  return res.data.data;
}
