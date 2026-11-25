import { api } from "@/lib/api";

export type Seniority = "INTERN" | "ENTRY" | "MID" | "SENIOR" | "LEAD" | "UNKNOWN";

export interface ParsedJdData {
  roleTitle: string;
  seniority: Seniority;
  experienceYears: {
    min: number;
    max: number | null;
  };
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  techStackCategories: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    cloudAndDevops: string[];
    toolsAndOther: string[];
  };
}

export interface JobDescriptionItem {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  rawText?: string;
  structuredJson: ParsedJdData;
  providerUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJdPayload {
  title: string;
  company?: string;
  rawText: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getJobDescriptionsApi(): Promise<JobDescriptionItem[]> {
  const res = await api.get<ApiEnvelope<{ jobDescriptions: JobDescriptionItem[] }>>(
    "/job-descriptions"
  );
  return res.data.data.jobDescriptions;
}

export async function createJobDescriptionApi(
  payload: CreateJdPayload
): Promise<JobDescriptionItem> {
  const res = await api.post<ApiEnvelope<{ jobDescription: JobDescriptionItem }>>(
    "/job-descriptions",
    payload
  );
  return res.data.data.jobDescription;
}

export async function deleteJobDescriptionApi(
  id: string
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<ApiEnvelope<{ success: boolean; message: string }>>(
    `/job-descriptions/${id}`
  );
  return res.data.data;
}
