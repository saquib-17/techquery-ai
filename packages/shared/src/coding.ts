import { z } from "zod";

export const SupportedCodeLanguageSchema = z.enum([
  "java",
  "python",
  "cpp",
  "javascript",
]);
export type SupportedCodeLanguage = z.infer<typeof SupportedCodeLanguageSchema>;

export const ProblemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export type ProblemDifficulty = z.infer<typeof ProblemDifficultySchema>;

export const DsaPatternSchema = z.enum([
  "ALL_PATTERNS",
  "ARRAYS_TWO_POINTERS",
  "SLIDING_WINDOW",
  "BINARY_SEARCH",
  "TREES_GRAPHS",
  "DYNAMIC_PROGRAMMING",
  "STACK_HEAP",
]);
export type DsaPattern = z.infer<typeof DsaPatternSchema>;

export const ExecutionVerdictSchema = z.enum([
  "ACCEPTED",
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "COMPILATION_ERROR",
  "RUNTIME_ERROR",
]);
export type ExecutionVerdict = z.infer<typeof ExecutionVerdictSchema>;

export const SessionModeSchema = z.enum(["UNTIMED", "TIMED"]);
export type SessionMode = z.infer<typeof SessionModeSchema>;

export const DifficultyPresetSchema = z.enum([
  "EASY_ONLY",
  "EASY_TO_MEDIUM",
  "MIXED_WITH_HARD",
  "SINGLE_FOCUS",
]);
export type DifficultyPreset = z.infer<typeof DifficultyPresetSchema>;

export const AssessmentStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatusSchema>;

export const ProblemExampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().optional(),
});
export type ProblemExample = z.infer<typeof ProblemExampleSchema>;

export const ProblemTestCaseSchema = z.object({
  id: z.string().min(1),
  stdin: z.string(),
  expectedOutput: z.string(),
  isSample: z.boolean(),
});
export type ProblemTestCase = z.infer<typeof ProblemTestCaseSchema>;

export const StarterCodeMapSchema = z.object({
  java: z.string(),
  python: z.string(),
  cpp: z.string(),
  javascript: z.string(),
});
export type StarterCodeMap = z.infer<typeof StarterCodeMapSchema>;

export const CodingProblemDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  difficulty: ProblemDifficultySchema,
  pattern: DsaPatternSchema,
  statement: z.string().min(1),
  constraints: z.array(z.string()),
  examples: z.array(ProblemExampleSchema),
  starterCode: StarterCodeMapSchema,
  sampleTestCases: z.array(ProblemTestCaseSchema),
  hiddenTestCaseCount: z.number().int().nonnegative(),
  hints: z.array(z.string()),
  createdAt: z.string(),
});
export type CodingProblemDto = z.infer<typeof CodingProblemDtoSchema>;

export const RunCodeModeSchema = z.enum(["SAMPLE", "SUBMIT"]);
export type RunCodeMode = z.infer<typeof RunCodeModeSchema>;

export const RunCodeInputSchema = z.object({
  problemId: z.string().uuid("Invalid problem ID format"),
  language: SupportedCodeLanguageSchema,
  code: z.string().min(1, "Code cannot be empty").max(100_000),
  mode: RunCodeModeSchema,
  assessmentSessionId: z
    .string()
    .uuid("Invalid assessment session ID format")
    .optional(),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

export const TestCaseExecutionDetailSchema = z.object({
  testCaseId: z.string(),
  passed: z.boolean(),
  stdin: z.string(),
  expectedOutput: z.string(),
  actualOutput: z.string(),
  stderr: z.string().optional(),
  compileOutput: z.string().optional(),
  runtimeMs: z.number().nonnegative().optional(),
});
export type TestCaseExecutionDetail = z.infer<
  typeof TestCaseExecutionDetailSchema
>;

export const CodeExecutionResultDtoSchema = z.object({
  verdict: ExecutionVerdictSchema,
  passedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  runtimeMs: z.number().nonnegative(),
  memoryKb: z.number().nonnegative(),
  results: z.array(TestCaseExecutionDetailSchema),
  submissionId: z.string().uuid().optional(),
});
export type CodeExecutionResultDto = z.infer<
  typeof CodeExecutionResultDtoSchema
>;

export const StartAssessmentInputSchema = z.object({
  mode: SessionModeSchema.default("TIMED"),
  difficultyPreset: DifficultyPresetSchema.default("EASY_TO_MEDIUM"),
  singleDifficulty: ProblemDifficultySchema.optional(),
  problemCount: z.coerce.number().int().min(1).max(3).default(3),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(180)
    .default(60)
    .optional(),
  focusPattern: DsaPatternSchema.optional(),
});
export type StartAssessmentInput = z.infer<typeof StartAssessmentInputSchema>;

export const SaveAssessmentDraftInputSchema = z.object({
  problemId: z.string().uuid("Invalid problem ID format"),
  language: SupportedCodeLanguageSchema,
  code: z.string().max(100_000),
});
export type SaveAssessmentDraftInput = z.infer<
  typeof SaveAssessmentDraftInputSchema
>;

export const AssessmentProblemSlotDtoSchema = z.object({
  orderIndex: z.number().int().min(1).max(3),
  maxPoints: z.literal(100),
  earnedPoints: z.number().int().min(0).max(100),
  solved: z.boolean(),
  problem: CodingProblemDtoSchema,
});
export type AssessmentProblemSlotDto = z.infer<
  typeof AssessmentProblemSlotDtoSchema
>;

export const AssessmentDraftEntrySchema = z.object({
  language: SupportedCodeLanguageSchema,
  code: z.string(),
  updatedAt: z.string(),
});
export type AssessmentDraftEntry = z.infer<typeof AssessmentDraftEntrySchema>;

export const AssessmentSessionDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  mode: SessionModeSchema,
  difficultyPreset: DifficultyPresetSchema,
  status: AssessmentStatusSchema,
  durationMinutes: z.number().int().positive().nullable(),
  startedAt: z.string(),
  expiresAt: z.string().nullable(),
  remainingSeconds: z.number().int().nonnegative().nullable(),
  totalScore: z.number().int().nonnegative(),
  maxTotalScore: z.number().int().positive(),
  problems: z.array(AssessmentProblemSlotDtoSchema),
  drafts: z.record(z.string(), AssessmentDraftEntrySchema),
});
export type AssessmentSessionDto = z.infer<typeof AssessmentSessionDtoSchema>;
