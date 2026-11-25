import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfileApi,
  createProfileApi,
  updateProfileApi,
  getOnboardingApi,
  updateOnboardingApi,
  type CandidateProfile,
  type SaveProfilePayload,
  type UpdateOnboardingPayload,
} from "./candidate.api";

export const candidateKeys = {
  profile: ["candidate", "profile"] as const,
  onboarding: ["candidate", "onboarding"] as const,
};

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: candidateKeys.profile,
    queryFn: getProfileApi,
    enabled,
  });
}

export function useOnboardingQuery(enabled = true) {
  return useQuery({
    queryKey: candidateKeys.onboarding,
    queryFn: getOnboardingApi,
    enabled,
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      isUpdate,
    }: {
      payload: SaveProfilePayload;
      isUpdate?: boolean;
    }) => {
      const existing =
        isUpdate ??
        Boolean(queryClient.getQueryData<CandidateProfile | null>(candidateKeys.profile));

      if (existing) {
        return updateProfileApi(payload);
      }
      return createProfileApi(payload);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(candidateKeys.profile, updatedProfile);
      void queryClient.invalidateQueries({ queryKey: candidateKeys.profile });
    },
  });
}

export function useUpdateOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOnboardingPayload) => updateOnboardingApi(payload),
    onSuccess: (updatedOnboarding) => {
      queryClient.setQueryData(candidateKeys.onboarding, updatedOnboarding);
      void queryClient.invalidateQueries({ queryKey: candidateKeys.onboarding });
    },
  });
}
