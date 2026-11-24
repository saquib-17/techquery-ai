import type { z } from "zod";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";
import { JsonSanitizer } from "./json-sanitizer.js";
import { OllamaDriver } from "./drivers/ollama.driver.js";
import { GroqDriver } from "./drivers/groq.driver.js";
import { MockDriver } from "./drivers/mock.driver.js";
import { AppError, BadRequestError } from "../errors/AppError.js";
import type {
  AIGatewayProvider,
  StructuredAIResult,
  AIProviderId,
  ExecutionContext,
} from "./ai.types.js";

export class AIGateway {
  private readonly providers: Map<AIProviderId, AIGatewayProvider> = new Map();

  constructor() {
    this.providers.set("OLLAMA", new OllamaDriver());
    this.providers.set("GROQ", new GroqDriver());
    this.providers.set("MOCK", new MockDriver());
  }

  /**
   * Resolves the primary active provider based on current configuration and environment.
   */
  public getActiveProvider(): AIGatewayProvider {
    // In test environment, always force MOCK provider unless explicitly set to another
    if (config.NODE_ENV === "test" || config.AI_PROVIDER === "mock") {
      return this.providers.get("MOCK")!;
    }

    if (config.AI_PROVIDER === "groq") {
      return this.providers.get("GROQ")!;
    }

    return this.providers.get("OLLAMA")!;
  }

  /**
   * Executes a prompt, sanitizes the JSON response, validates against Zod schema,
   * performs a 1-turn auto-repair loop if validation fails, and executes deterministic
   * fallback if unrepairable.
   */
  public async completeStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    context: ExecutionContext<T>
  ): Promise<StructuredAIResult<T>> {
    const startTime = Date.now();
    const provider = this.getActiveProvider();
    const modelName =
      provider.id === "OLLAMA"
        ? config.AI_LOCAL_MODEL
        : provider.id === "GROQ"
          ? config.GROQ_MODEL
          : "mock-v1";

    let rawOutput = "";

    try {
      // 1. Initial completion attempt
      rawOutput = await provider.complete(prompt, context);
      const parsed = this.tryParseAndValidate(rawOutput, schema);

      if (parsed.success) {
        return {
          success: true,
          data: parsed.data,
          providerUsed: provider.id,
          modelName,
          latencyMs: Date.now() - startTime,
          isFallback: false,
        };
      }

      // 2. Validation or parse failed -> Attempt 1-turn auto-repair
      logger.warn(
        { provider: provider.id, issues: parsed.error },
        "AI output failed schema validation. Initiating 1-turn auto-repair turn."
      );

      const repairPrompt = `Your previous JSON output failed validation with this specific error:\n${parsed.error}\n\nHere was your previous response:\n${JsonSanitizer.extractJson(rawOutput)}\n\nPlease repair the JSON so that it strictly adheres to the requested schema. Return ONLY the valid JSON object without markdown or explanations.`;

      const repairedRaw = await provider.complete(repairPrompt, {
        ...context,
        temperature: 0.0,
      });

      const repairedParsed = this.tryParseAndValidate(repairedRaw, schema);

      if (repairedParsed.success) {
        return {
          success: true,
          data: repairedParsed.data,
          providerUsed: provider.id,
          modelName,
          latencyMs: Date.now() - startTime,
          isFallback: false,
        };
      }

      logger.warn(
        { provider: provider.id, issues: repairedParsed.error },
        "AI auto-repair turn also failed validation."
      );

      // If auto-repair failed, proceed to fallback below
    } catch (err: any) {
      logger.warn({ err, provider: provider.id }, "AI provider execution failed");
      // If error occurred and no fallback function provided, re-throw controlled error
      if (!context.fallbackFn) {
        if (err instanceof AppError) {
          throw err;
        }
        throw new BadRequestError(`AI execution failed: ${err.message}`, "AI_EXECUTION_FAILED");
      }
    }

    // 3. Deterministic Heuristic Fallback
    if (context.fallbackFn) {
      logger.info({ taskType: context.taskType }, "Executing deterministic fallback engine");
      const fallbackData = context.fallbackFn(context.rawInputText || "");
      return {
        success: true,
        data: fallbackData,
        providerUsed: "FALLBACK",
        modelName: "deterministic-heuristic-v1",
        latencyMs: Date.now() - startTime,
        isFallback: true,
      };
    }

    throw new BadRequestError(
      "AI output could not be validated against the required schema.",
      "AI_VALIDATION_FAILED"
    );
  }

  private tryParseAndValidate<T>(
    raw: string,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; error: string } {
    try {
      const sanitized = JsonSanitizer.extractJson(raw);
      const jsonParsed = JSON.parse(sanitized);
      const validation = schema.safeParse(jsonParsed);

      if (validation.success) {
        return { success: true, data: validation.data };
      }

      const issues = validation.error.issues
        .map((i) => `Path '${i.path.join(".")}': ${i.message}`)
        .join("; ");
      return { success: false, error: issues };
    } catch (jsonErr: any) {
      return { success: false, error: `JSON Parse Error: ${jsonErr.message}` };
    }
  }
}

export const aiGateway = new AIGateway();
