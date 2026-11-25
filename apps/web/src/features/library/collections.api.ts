import { api } from "@/lib/api";
import type { QuestionItem } from "@/features/questions/questions.api";

export interface CollectionSummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface CollectionEntry {
  id: string;
  collectionId: string;
  questionId: string;
  addedAt: string;
  question: QuestionItem;
}

export interface CollectionDetail {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  items: CollectionEntry[];
}

export interface CreateCollectionPayload {
  name: string;
  description?: string;
}

export interface UpdateCollectionPayload {
  name?: string;
  description?: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function getCollectionsApi(): Promise<CollectionSummary[]> {
  const res = await api.get<ApiEnvelope<{ collections: CollectionSummary[] }>>(
    "/collections",
  );
  return res.data.data.collections;
}

export async function getCollectionDetailApi(
  id: string,
): Promise<CollectionDetail> {
  const res = await api.get<ApiEnvelope<{ collection: CollectionDetail }>>(
    `/collections/${id}`,
  );
  return res.data.data.collection;
}

export async function createCollectionApi(
  payload: CreateCollectionPayload,
): Promise<CollectionSummary> {
  const res = await api.post<ApiEnvelope<{ collection: CollectionSummary }>>(
    "/collections",
    payload,
  );
  return res.data.data.collection;
}

export async function updateCollectionApi(
  id: string,
  payload: UpdateCollectionPayload,
): Promise<CollectionSummary> {
  const res = await api.patch<ApiEnvelope<{ collection: CollectionSummary }>>(
    `/collections/${id}`,
    payload,
  );
  return res.data.data.collection;
}

export async function deleteCollectionApi(id: string): Promise<void> {
  await api.delete(`/collections/${id}`);
}

export async function addCollectionItemApi(
  collectionId: string,
  questionId: string,
): Promise<void> {
  await api.post(`/collections/${collectionId}/items`, { questionId });
}

export async function removeCollectionItemApi(
  collectionId: string,
  questionId: string,
): Promise<void> {
  await api.delete(`/collections/${collectionId}/items/${questionId}`);
}

export async function exportCollectionPdf(
  id: string,
  name: string,
): Promise<void> {
  const res = await api.get<Blob>(`/collections/${id}/export/pdf`, {
    responseType: "blob",
  });

  const safeName =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "study-collection";

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
