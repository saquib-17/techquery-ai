import { z } from "zod";
import {
  DsaPatternSchema,
  ProblemDifficultySchema,
  SupportedCodeLanguageSchema,
} from "./coding.js";

export const QuestionCategorySchema = z.enum([
  "THEORETICAL",
  "CODING",
  "SYSTEM_DESIGN",
  "BEHAVIORAL",
  "PROJECT_DEFENSE",
]);
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>;

export const QuestionGenerationModeSchema = z.enum([
  "ROLE_AND_JD",
  "DSA_ALGORITHMS",
]);
export type QuestionGenerationMode = z.infer<
  typeof QuestionGenerationModeSchema
>;

export const GenerateQuestionSetInputSchema = z.object({
  resumeId: z.string().uuid("Invalid resume ID format").optional(),
  jdId: z.string().uuid("Invalid job description ID format").optional(),
  matchId: z.string().uuid("Invalid match ID format").optional(),
  title: z.string().trim().min(3).max(200).optional(),
  topicFocus: z
    .string()
    .trim()
    .min(3, "Topic focus must be at least 3 characters")
    .max(100, "Topic focus must not exceed 100 characters")
    .default("Full-Stack & Core Software Engineering"),
  difficulty: ProblemDifficultySchema.default("MEDIUM"),
  categories: z
    .array(QuestionCategorySchema)
    .min(1, "At least one category is required")
    .default([
      "THEORETICAL",
      "CODING",
      "SYSTEM_DESIGN",
      "BEHAVIORAL",
      "PROJECT_DEFENSE",
    ]),
  count: z.coerce
    .number()
    .int("Question count must be an integer")
    .min(3, "Question count must be at least 3")
    .max(20, "Question count must not exceed 20")
    .default(10),
  generationMode: QuestionGenerationModeSchema.default("ROLE_AND_JD"),
  dsaPattern: DsaPatternSchema.optional(),
  preferredLanguage: SupportedCodeLanguageSchema.optional(),
});
export type GenerateQuestionSetInput = z.infer<
  typeof GenerateQuestionSetInputSchema
>;

export const QuestionItemDtoSchema = z.object({
  id: z.string().uuid(),
  questionSetId: z.string().uuid(),
  category: QuestionCategorySchema,
  difficulty: ProblemDifficultySchema,
  targetedSkill: z.string(),
  questionText: z.string(),
  interviewerIntent: z.string(),
  keyEvaluationPoints: z.array(z.string()),
  codingProblemId: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
});
export type QuestionItemDto = z.infer<typeof QuestionItemDtoSchema>;
