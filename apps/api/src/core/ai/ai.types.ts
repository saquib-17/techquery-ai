export type AIProviderId = "OLLAMA" | "GROQ" | "MOCK" | "FALLBACK";

export type AITaskType =
  | "ATS_AUDIT"
  | "RESUME_PARSE"
  | "JD_DECOMPOSE"
  | "MATCH_ANALYSIS"
  | "QGEN"
  | "AGEN";

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  taskType: AITaskType;
  systemPrompt?: string;
  userId?: string;
}

export interface AIGatewayProvider {
  readonly id: AIProviderId;
  isHealthy(): Promise<boolean>;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
}

export interface StructuredAIResult<T> {
  success: boolean;
  data: T;
  providerUsed: AIProviderId;
  modelName: string;
  latencyMs: number;
  isFallback: boolean;
}

export interface ExecutionContext<T> extends CompletionOptions {
  fallbackFn?: (rawText: string) => T;
  rawInputText?: string;
}
