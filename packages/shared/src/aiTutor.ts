import { z } from "zod";

export const AiTutorContextTypeSchema = z.enum([
  "CS_TOPIC",
  "DSA_PROBLEM",
  "CODING_IDE",
  "OA_REVIEW",
  "STUDY_ROADMAP",
  "RESUME_MATCH",
]);
export type AiTutorContextType = z.infer<typeof AiTutorContextTypeSchema>;

export const AiTutorMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1, "Message cannot be empty").max(4000),
  })
  .refine((m) => m.role !== "user" || m.content.length <= 1000, {
    message: "User message must be at most 1000 characters",
  });
export type AiTutorMessage = z.infer<typeof AiTutorMessageSchema>;

export const AiTutorChatInputSchema = z.object({
  contextType: AiTutorContextTypeSchema,
  contextId: z.string().trim().min(1).max(200),
  contextTitle: z.string().trim().min(1).max(300),
  contextSummary: z.string().max(4000).optional().default(""),
  messages: z.array(AiTutorMessageSchema).min(1).max(10),
});
export type AiTutorChatInput = z.infer<typeof AiTutorChatInputSchema>;

export interface AiTutorChatResponseDto {
  reply: string;
  providerUsed: "GROQ" | "OLLAMA" | "FALLBACK";
}
