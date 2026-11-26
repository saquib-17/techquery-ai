import { z } from "zod";

export const RoadmapLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);
export type RoadmapLevel = z.infer<typeof RoadmapLevelSchema>;

export const GenerateRoadmapSchema = z.object({
  targetRole: z.string().trim().min(2).max(120),
  durationWeeks: z.number().int().min(1).max(52),
  dailyHours: z.number().min(0.5).max(12),
  currentLevel: RoadmapLevelSchema,
  focusSkills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});
export type GenerateRoadmapInput = z.infer<typeof GenerateRoadmapSchema>;

export const RoadmapResourceTypeSchema = z.enum([
  "DOCS",
  "COURSE",
  "PRACTICE",
  "ARTICLE",
  "VIDEO",
]);
export type RoadmapResourceType = z.infer<typeof RoadmapResourceTypeSchema>;

export const RoadmapResourceSchema = z.object({
  title: z.string().min(1),
  platform: z.string().min(1),
  type: RoadmapResourceTypeSchema,
  url: z.string().min(1),
});
export type RoadmapResource = z.infer<typeof RoadmapResourceSchema>;

export const RoadmapTaskSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedHours: z.number().positive(),
  completed: z.boolean().default(false),
});
export type RoadmapTask = z.infer<typeof RoadmapTaskSchema>;

export const RoadmapPhaseSchema = z.object({
  phaseNumber: z.number().int().positive(),
  weekLabel: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  milestoneDeliverable: z.string().min(1),
  tasks: z.array(RoadmapTaskSchema).min(1),
  resources: z.array(RoadmapResourceSchema).min(1),
});
export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;

export const ToggleRoadmapTaskSchema = z.object({
  taskId: z.string().min(1),
  completed: z.boolean(),
});
export type ToggleRoadmapTaskInput = z.infer<typeof ToggleRoadmapTaskSchema>;

export interface LearningRoadmapDto {
  id: string;
  title: string;
  targetRole: string;
  durationWeeks: number;
  dailyHours: number;
  currentLevel: RoadmapLevel;
  phases: RoadmapPhase[];
  completedTasks: number;
  totalTasks: number;
  createdAt: string;
  updatedAt: string;
}
