import { api, ApiClientError } from "@/lib/api";

export interface ResumeItem {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileExtension: string;
  fileSize: number;
  processingStatus: "UPLOADED" | "PENDING" | "PROCESSED" | "FAILED";
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSectionScores {
  contact: number;
  summary: number;
  experience: number;
  skills: number;
  education: number;
}

export interface ResumeImprovement {
  original: string;
  suggested: string;
  reason: string;
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  atsScore: number;
  sectionScores: ResumeSectionScores;
  strengths: string[];
  issues: string[];
  improvements: ResumeImprovement[];
  providerUsed?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedResumeData {
  summary: string;
  skills: {
    technical: string[];
    tools: string[];
    soft: string[];
  };
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects: Array<{
    name: string;
    techStack: string[];
    description: string;
  }>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getResumesApi(): Promise<ResumeItem[]> {
  const res = await api.get<ApiEnvelope<{ resumes: ResumeItem[] }>>("/resumes");
  return res.data.data.resumes;
}

export async function uploadResumeApi(file: File): Promise<ResumeItem> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<ApiEnvelope<{ resume: ResumeItem }>>("/resumes", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data.resume;
}

export async function setPrimaryResumeApi(id: string): Promise<ResumeItem> {
  const res = await api.patch<ApiEnvelope<{ resume: ResumeItem }>>(
    `/resumes/${id}/primary`
  );
  return res.data.data.resume;
}

export async function deleteResumeApi(id: string): Promise<{ message: string }> {
  const res = await api.delete<ApiEnvelope<{ message: string }>>(`/resumes/${id}`);
  return res.data.data;
}

export async function analyzeResumeApi(
  id: string
): Promise<{ analysis: ResumeAnalysis; parsedData: ParsedResumeData }> {
  const res = await api.post<
    ApiEnvelope<{ analysis: ResumeAnalysis; parsedData: ParsedResumeData }>
  >(`/resumes/${id}/analyze`);
  return res.data.data;
}

export async function getResumeAnalysisApi(
  id: string
): Promise<ResumeAnalysis | null> {
  try {
    const res = await api.get<ApiEnvelope<{ analysis: ResumeAnalysis }>>(
      `/resumes/${id}/analysis`
    );
    return res.data.data.analysis;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getParsedResumeDataApi(
  id: string
): Promise<ParsedResumeData | null> {
  try {
    const res = await api.get<ApiEnvelope<{ parsedData: ParsedResumeData }>>(
      `/resumes/${id}/parsed-data`
    );
    return res.data.data.parsedData;
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function downloadResumeFile(id: string, fileName: string): Promise<void> {
  const res = await api.get<Blob>(`/resumes/${id}/download`, {
    responseType: "blob",
  });
  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
