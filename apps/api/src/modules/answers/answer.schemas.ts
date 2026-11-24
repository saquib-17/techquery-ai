import { z } from "zod";

export const AnswerStyleEnum = z.enum(["CONCISE", "DETAILED", "INTERVIEW"]);
export type AnswerStyle = z.infer<typeof AnswerStyleEnum>;

export const GenerateAnswerSchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
  style: AnswerStyleEnum.default("INTERVIEW"),
  regenerate: z.boolean().default(false),
});
export type GenerateAnswerInput = z.infer<typeof GenerateAnswerSchema>;

export const QuestionIdParamSchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
});
export type QuestionIdParam = z.infer<typeof QuestionIdParamSchema>;

export const AnswerAIResponseSchema = z.object({
  shortSummary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(1000, "Summary exceeds maximum allowed length"),
  detailedExplanation: z
    .string()
    .min(20, "Explanation must be at least 20 characters"),
  codeSnippet: z.string().nullable(),
  timeComplexity: z.string().max(50).nullable(),
  spaceComplexity: z.string().max(50).nullable(),
  commonMistakes: z
    .array(z.string().min(5).max(300))
    .min(1, "At least one common mistake is required")
    .max(10),
});
export type AnswerAIResponse = z.infer<typeof AnswerAIResponseSchema>;
