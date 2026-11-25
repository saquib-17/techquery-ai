import { api } from "@/lib/api";

export type UserTier = "FREE" | "PRO";

export interface ResourceQuotaStatus {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
}

export interface UserQuotasResponse {
  tier: UserTier;
  quotas: {
    resumes: ResourceQuotaStatus;
    jobDescriptions: ResourceQuotaStatus;
    questionSetsMonthly: ResourceQuotaStatus;
    answersMonthly: ResourceQuotaStatus;
  };
}

export interface UpdateTierResponse {
  tier: UserTier;
  message: string;
  quotas: UserQuotasResponse["quotas"];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getUsageQuotasApi(): Promise<UserQuotasResponse> {
  const res = await api.get<ApiEnvelope<UserQuotasResponse>>("/usage/quotas");
  return res.data.data;
}

export async function updateTierApi(
  tier: UserTier,
): Promise<UpdateTierResponse> {
  const res = await api.patch<ApiEnvelope<UpdateTierResponse>>("/usage/tier", {
    tier,
  });
  return res.data.data;
}
