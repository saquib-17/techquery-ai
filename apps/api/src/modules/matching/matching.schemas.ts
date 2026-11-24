import { z } from "zod";

export const CreateMatchSchema = z.object({
  resumeId: z.string().uuid("Invalid resume ID format"),
  jdId: z.string().uuid("Invalid job description ID format"),
});
export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;

export const MatchIdParamSchema = z.object({
  id: z.string().uuid("Invalid match ID format"),
});
export type MatchIdParam = z.infer<typeof MatchIdParamSchema>;

export const MissingSkillImportanceEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type MissingSkillImportance = z.infer<typeof MissingSkillImportanceEnum>;

export const MissingSkillItemSchema = z.object({
  skill: z.string().min(1),
  importance: MissingSkillImportanceEnum,
  category: z.string().default("General"),
});
export type MissingSkillItem = z.infer<typeof MissingSkillItemSchema>;

export const ScoreBreakdownSchema = z.object({
  mustHaveSkillsScore: z.number().min(0).max(100),
  niceToHaveSkillsScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  domainScore: z.number().min(0).max(100),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const MatchQualitativeAnalysisSchema = z.object({
  experienceMatch: z.string().min(1, "experienceMatch is required"),
  projectRelevance: z.string().min(1, "projectRelevance is required"),
  strengths: z.array(z.string()).min(1, "At least one strength is required"),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()).min(1, "At least one recommendation is required"),
});
export type MatchQualitativeAnalysis = z.infer<typeof MatchQualitativeAnalysisSchema>;
