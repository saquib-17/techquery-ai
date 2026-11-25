import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCollectionItemApi,
  createCollectionApi,
  deleteCollectionApi,
  getCollectionDetailApi,
  getCollectionsApi,
  removeCollectionItemApi,
  updateCollectionApi,
  type CreateCollectionPayload,
  type UpdateCollectionPayload,
} from "./collections.api";

export const collectionKeys = {
  all: ["collections"] as const,
  detail: (id: string) => ["collections", id] as const,
};

export function useCollectionsQuery() {
  return useQuery({
    queryKey: collectionKeys.all,
    queryFn: getCollectionsApi,
  });
}

export function useCollectionDetailQuery(id: string | null) {
  return useQuery({
    queryKey: collectionKeys.detail(id ?? ""),
    queryFn: () => getCollectionDetailApi(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCollectionPayload) =>
      createCollectionApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useUpdateCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCollectionPayload;
    }) => updateCollectionApi(id, payload),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(vars.id),
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteCollectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCollectionApi(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: collectionKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useAddCollectionItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      questionId,
    }: {
      collectionId: string;
      questionId: string;
    }) => addCollectionItemApi(collectionId, questionId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(vars.collectionId),
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useRemoveCollectionItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      questionId,
    }: {
      collectionId: string;
      questionId: string;
    }) => removeCollectionItemApi(collectionId, questionId),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      void queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(vars.collectionId),
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}
