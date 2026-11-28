import type { z } from "zod";
import { config } from "../core/config/index.js";
import { logger } from "../core/logger/index.js";
import { ServiceUnavailableError } from "../core/errors/AppError.js";
import { JsonSanitizer } from "../core/ai/json-sanitizer.js";
import { aiGateway } from "../core/ai/ai.gateway.js";

export type GroqChainType = "heavy" | "fast" | "walkthrough" | "tutor";

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CreateGroqCompletionOptions {
  prompt?: string;
  messages?: GroqChatMessage[];
  systemPrompt?: string;
  chainType?: GroqChainType;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  modelChain?: string[];
  signal?: AbortSignal;
}

export interface GroqCompletionResult {
  content: string;
  modelUsed: string;
}

const DISALLOWED_MODELS = new Set([
  "meta-llama/llama-prompt-guard-2-86m",
  "meta-llama/llama-prompt-guard-2-22m",
]);

/**
 * Ordered fallback model chains:
 * - Heavy / Walkthrough Chain: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
 * - Fast Interactive Tutor Chain: ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b']
 * Respects GROQ_MODEL / GROQ_TUTOR_MODEL as highest priority when set.
 */
export function getGroqModelChain(chainType: GroqChainType = "heavy"): string[] {
  const isFast = chainType === "fast" || chainType === "tutor";
  if (isFast) {
    const customModel = process.env.GROQ_TUTOR_MODEL?.trim();
    const defaultChain = [
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
      "qwen/qwen3.8-27b",
    ];
    const candidateList = customModel
      ? [customModel, ...defaultChain]
      : defaultChain;

    return Array.from(new Set(candidateList)).filter(
      (model) => Boolean(model && model.trim()) && !DISALLOWED_MODELS.has(model)
    );
  }

  const customModel = (process.env.GROQ_MODEL || config.GROQ_MODEL)?.trim();
  const defaultChain = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ];

  const candidateList = customModel
    ? [customModel, ...defaultChain]
    : defaultChain;

  return Array.from(new Set(candidateList)).filter(
    (model) => Boolean(model && model.trim()) && !DISALLOWED_MODELS.has(model)
  );
}

/**
 * Centralized Groq waterfall completion helper.
 * Iterates through the ordered model list.
 * Automatically fails over on 429, 502, 503, 504, network timeout, or empty content.
 */
export async function createGroqCompletion(
  promptOrOptions: string | CreateGroqCompletionOptions,
  maybeOptions?: CreateGroqCompletionOptions
): Promise<GroqCompletionResult> {
  const options: CreateGroqCompletionOptions =
    typeof promptOrOptions === "string"
      ? { prompt: promptOrOptions, ...maybeOptions }
      : promptOrOptions;

  const apiKey = (
    process.env.GROQ_API_KEY !== undefined
      ? process.env.GROQ_API_KEY
      : config.GROQ_API_KEY || ""
  ).trim();
  if (!apiKey) {
    throw new ServiceUnavailableError(
      "GROQ_API_KEY is not configured on this server.",
      "AI_PROVIDER_UNAVAILABLE"
    );
  }

  const endpoint = "https://api.groq.com/openai/v1/chat/completions";
  const models =
    options.modelChain && options.modelChain.length > 0
      ? options.modelChain.filter((m) => !DISALLOWED_MODELS.has(m))
      : getGroqModelChain(options.chainType);

  const messages: GroqChatMessage[] = [];
  if (options.messages && options.messages.length > 0) {
    if (options.systemPrompt && !options.messages.some((m) => m.role === "system")) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push(...options.messages);
  } else {
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    if (options.prompt) {
      messages.push({ role: "user", content: options.prompt });
    }
  }

  const timeoutMs = options.timeoutMs ?? config.AI_TIMEOUT_MS;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const payload: Record<string, unknown> = {
        model,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.jsonMode !== false ? { response_format: { type: "json_object" } } : {}),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: options.signal ?? controller.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
        };
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent && rawContent.trim().length > 0) {
          const finalContent =
            options.jsonMode !== false
              ? JsonSanitizer.extractJson(rawContent)
              : rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

          if (i > 0) {
            logger.info(
              { modelUsed: model, attempts: i + 1 },
              `[groq-fallback] Succeeded using fallback model ${model}`
            );
          }
          return { content: finalContent, modelUsed: model };
        }

        logger.warn(
          `[groq-fallback] Model ${model} hit rate limit/error (empty content), failing over to next model...`
        );
        continue;
      }

      const status = response.status;
      logger.warn(
        `[groq-fallback] Model ${model} hit rate limit/error (${status}), failing over to next model...`
      );
    } catch (err: any) {
      const errReason = err?.name === "AbortError" ? "timeout" : err?.message || "network error";
      logger.warn(
        `[groq-fallback] Model ${model} hit rate limit/error (${errReason}), failing over to next model...`
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ServiceUnavailableError(
    "Groq Cloud generation failed across all configured models.",
    "AI_RATE_LIMIT"
  );
}

export interface CreateGroqStructuredOptions<T> extends CreateGroqCompletionOptions {
  fallbackFn?: (rawInput?: string) => T;
  taskType?: string;
  userId?: string;
  rawInputText?: string;
  forceGroq?: boolean;
}

/**
 * Structured helper validating Groq output against a Zod schema with 1-turn auto-repair,
 * offline fallback preservation, and Vitest mock compatibility.
 */
export async function createGroqStructured<T>(
  schema: z.ZodSchema<T>,
  options: CreateGroqStructuredOptions<T>
): Promise<{ success: boolean; data: T; providerUsed: "GROQ" | "FALLBACK"; modelUsed: string }> {
  // In test environment or when mock provider is configured, delegate cleanly to aiGateway so existing integration tests succeed deterministically
  if ((config.NODE_ENV === "test" || config.AI_PROVIDER === "mock") && !options.forceGroq) {
    const aiResult = await aiGateway.completeStructured<T>(options.prompt || "", schema, {
      taskType: (options.taskType as any) || "AGEN",
      userId: options.userId,
      rawInputText: options.rawInputText || options.prompt || "",
      fallbackFn: options.fallbackFn,
    });
    return {
      success: true,
      data: aiResult.data,
      providerUsed: aiResult.providerUsed === "MOCK" ? "FALLBACK" : (aiResult.providerUsed as any),
      modelUsed: aiResult.modelName,
    };
  }

  try {
    const res = await createGroqCompletion({
      ...options,
      jsonMode: options.jsonMode !== false,
    });

    const parsedJson = JSON.parse(res.content);
    const validated = schema.safeParse(parsedJson);
    if (validated.success) {
      return {
        success: true,
        data: validated.data,
        providerUsed: "GROQ",
        modelUsed: res.modelUsed,
      };
    }

    // 1-turn auto-repair attempt
    logger.warn(
      { issues: validated.error.message },
      "Groq JSON output failed schema validation. Attempting 1-turn auto-repair."
    );
    const repairPrompt = `Your previous JSON output failed validation with this specific error:\n${validated.error.message}\n\nHere was your previous response:\n${res.content}\n\nPlease repair the JSON so that it strictly adheres to the requested schema. Return ONLY valid JSON.`;
    const repairRes = await createGroqCompletion({
      prompt: repairPrompt,
      chainType: options.chainType,
      temperature: 0.0,
      jsonMode: true,
    });
    const repairParsed = JSON.parse(repairRes.content);
    const repairValidated = schema.safeParse(repairParsed);
    if (repairValidated.success) {
      return {
        success: true,
        data: repairValidated.data,
        providerUsed: "GROQ",
        modelUsed: repairRes.modelUsed,
      };
    }
  } catch (err) {
    logger.warn({ err }, "Groq structured generation failed across waterfall; invoking fallback");
  }

  if (options.fallbackFn) {
    return {
      success: true,
      data: options.fallbackFn(options.rawInputText || options.prompt || ""),
      providerUsed: "FALLBACK",
      modelUsed: "deterministic-heuristic-v1",
    };
  }

  throw new ServiceUnavailableError(
    "AI output could not be validated against the required schema.",
    "AI_VALIDATION_FAILED"
  );
}
