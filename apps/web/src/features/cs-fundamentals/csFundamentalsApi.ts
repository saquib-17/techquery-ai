import { api } from "@/lib/api";
import type {
  CsFundamentalsSummary,
  CsTopicStatus,
  CsTopicWithProgress,
  CsWalkthroughDto,
} from "@techquery/shared";

export interface CsFundamentalsResponse {
  summary: CsFundamentalsSummary;
  topics: CsTopicWithProgress[];
}

export async function fetchCsFundamentalsApi(): Promise<CsFundamentalsResponse> {
  const res = await api.get<{
    success: boolean;
    data: CsFundamentalsResponse;
  }>("/cs-fundamentals");
  return res.data.data;
}

export async function updateCsProgressApi(
  topicSlug: string,
  payload: { status?: CsTopicStatus; notes?: string | null }
): Promise<{
  topicSlug: string;
  status: CsTopicStatus;
  notes: string | null;
  updatedAt: string;
}> {
  const res = await api.put<{
    success: boolean;
    data: {
      progress: {
        topicSlug: string;
        status: CsTopicStatus;
        notes: string | null;
        updatedAt: string;
      };
    };
  }>(`/cs-fundamentals/${encodeURIComponent(topicSlug)}/progress`, payload);
  return res.data.data.progress;
}

export async function generateCsWalkthroughApi(
  topicSlug: string
): Promise<CsWalkthroughDto> {
  const res = await api.post<{
    success: boolean;
    data: { walkthrough: CsWalkthroughDto };
  }>(`/cs-fundamentals/${encodeURIComponent(topicSlug)}/walkthrough`);
  return res.data.data.walkthrough;
}
