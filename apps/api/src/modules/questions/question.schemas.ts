import { z } from "zod";
import {
  DsaPatternSchema,
  ProblemExampleSchema,
  QuestionGenerationModeSchema,
  StarterCodeMapSchema,
  SupportedCodeLanguageSchema,
} from "@techquery/shared";

export const QuestionCategoryEnum = z.enum([
  "THEORETICAL",
  "CODING",
  "SYSTEM_DESIGN",
  "BEHAVIORAL",
  "PROJECT_DEFENSE",
]);
export type QuestionCategory = z.infer<typeof QuestionCategoryEnum>;

export const QuestionDifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
export type QuestionDifficulty = z.infer<typeof QuestionDifficultyEnum>;

export const QuestionItemAISchema = z.object({
  category: QuestionCategoryEnum,
  difficulty: QuestionDifficultyEnum,
  targetedSkill: z.string().min(1).max(100),
  questionText: z.string().min(15).max(1000),
  interviewerIntent: z.string().min(10).max(500),
  keyEvaluationPoints: z.array(z.string().min(3).max(300)).min(1).max(10),
});
export type QuestionItemAI = z.infer<typeof QuestionItemAISchema>;

export const QuestionSetAIResponseSchema = z.object({
  title: z.string().min(3).max(200),
  questions: z.array(QuestionItemAISchema).min(1),
});
export type QuestionSetAIResponse = z.infer<typeof QuestionSetAIResponseSchema>;

export const GenerateQuestionSetSchema = z.object({
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
  difficulty: QuestionDifficultyEnum.default("MEDIUM"),
  categories: z
    .array(QuestionCategoryEnum)
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
export type GenerateQuestionSetInput = z.infer<typeof GenerateQuestionSetSchema>;

export const DsaTestCaseAISchema = z.object({
  stdin: z.string(),
  expectedOutput: z.string(),
});

export const DsaProblemItemAISchema = z.object({
  title: z.string().min(3).max(200),
  difficulty: QuestionDifficultyEnum,
  pattern: DsaPatternSchema.default("ARRAYS_TWO_POINTERS"),
  statement: z.string().min(20).max(5000),
  constraints: z.array(z.string().min(1)).min(1).max(15),
  examples: z.array(ProblemExampleSchema).min(1).max(5),
  hints: z.array(z.string().min(1)).min(1).max(5),
  starterCode: StarterCodeMapSchema,
  driverCode: StarterCodeMapSchema.optional(),
  sampleTestCases: z.array(DsaTestCaseAISchema).min(2).max(5),
  hiddenTestCases: z.array(DsaTestCaseAISchema).min(3).max(10),
  targetedSkill: z.string().min(1).max(100).optional(),
  interviewerIntent: z.string().min(10).max(500).optional(),
  keyEvaluationPoints: z.array(z.string().min(3).max(300)).min(1).max(10).optional(),
});
export type DsaProblemItemAI = z.infer<typeof DsaProblemItemAISchema>;

export const DsaQuestionSetAIResponseSchema = z.object({
  title: z.string().min(3).max(200),
  problems: z.array(DsaProblemItemAISchema).min(1),
});
export type DsaQuestionSetAIResponse = z.infer<typeof DsaQuestionSetAIResponseSchema>;

export const QuestionSetIdParamSchema = z.object({
  id: z.string().uuid("Invalid question set ID format"),
});
export type QuestionSetIdParam = z.infer<typeof QuestionSetIdParamSchema>;
