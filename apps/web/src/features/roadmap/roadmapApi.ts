import { api } from "@/lib/api";
import type {
  GenerateRoadmapInput,
  LearningRoadmapDto,
  ToggleRoadmapTaskInput,
} from "@techquery/shared";

export async function fetchRoadmapsApi(): Promise<LearningRoadmapDto[]> {
  const res = await api.get<{
    success: boolean;
    data: { roadmaps: LearningRoadmapDto[] };
  }>("/roadmaps");
  return res.data.data.roadmaps;
}

export async function generateRoadmapApi(
  payload: GenerateRoadmapInput
): Promise<LearningRoadmapDto> {
  const res = await api.post<{
    success: boolean;
    data: { roadmap: LearningRoadmapDto };
  }>("/roadmaps/generate", payload);
  return res.data.data.roadmap;
}

export async function toggleRoadmapTaskApi(
  roadmapId: string,
  payload: ToggleRoadmapTaskInput
): Promise<LearningRoadmapDto> {
  const res = await api.patch<{
    success: boolean;
    data: { roadmap: LearningRoadmapDto };
  }>(`/roadmaps/${encodeURIComponent(roadmapId)}/tasks`, payload);
  return res.data.data.roadmap;
}

export async function deleteRoadmapApi(roadmapId: string): Promise<void> {
  await api.delete(`/roadmaps/${encodeURIComponent(roadmapId)}`);
}
