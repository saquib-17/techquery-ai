import { config } from "../../config/index.js";
import { logger } from "../../logger/index.js";
import { ServiceUnavailableError } from "../../errors/AppError.js";
import { JsonSanitizer } from "../json-sanitizer.js";
import type { AIGatewayProvider, CompletionOptions, AIProviderId } from "../ai.types.js";

export class GroqDriver implements AIGatewayProvider {
  public readonly id: AIProviderId = "GROQ";
  private readonly endpoint = "https://api.groq.com/openai/v1/chat/completions";

  public async isHealthy(): Promise<boolean> {
    return Boolean(config.GROQ_API_KEY && config.GROQ_API_KEY.trim().length > 0);
  }

  public async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    if (!config.GROQ_API_KEY || config.GROQ_API_KEY.trim().length === 0) {
      throw new ServiceUnavailableError(
        "GROQ_API_KEY is not configured on this server.",
        "AI_PROVIDER_UNAVAILABLE"
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.AI_TIMEOUT_MS);

    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }

      messages.push({ role: "user", content: prompt });

      const candidateModels = Array.from(
        new Set([config.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b"])
      );

      let response: Response | null = null;
      let lastErrorText = "";

      for (let i = 0; i < candidateModels.length; i++) {
        const model = candidateModels[i]!;
        const payload: Record<string, unknown> = {
          model,
          messages,
          temperature: options?.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? 4096,
          ...(options?.jsonMode !== false ? { response_format: { type: "json_object" } } : {}),
        };

        response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.GROQ_API_KEY}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.ok) {
          if (i > 0) {
            logger.warn(
              { primaryModel: config.GROQ_MODEL, fallbackModel: model },
              "Primary Groq model failed; succeeded using fallback Groq model"
            );
          }
          break;
        }

        lastErrorText = await response.text().catch(() => "");
        const canRetryWithFallback =
          (response.status === 400 ||
            response.status === 404 ||
            response.status === 429) &&
          i < candidateModels.length - 1;
        if (!canRetryWithFallback) {
          if (response.status === 429) {
            throw new ServiceUnavailableError(
              "Groq Cloud free-tier rate limit exceeded. Please try again shortly.",
              "AI_RATE_LIMIT"
            );
          }
          logger.error(
            { status: response.status, model, errorText: lastErrorText },
            "Groq generation failed"
          );
          throw new ServiceUnavailableError(
            `Groq Cloud generation returned status ${response.status}`,
            "AI_PROVIDER_ERROR"
          );
        }

        logger.warn(
          { status: response.status, failedModel: model, nextModel: candidateModels[i + 1] },
          "Groq model unavailable; retrying with fallback model"
        );
      }

      if (!response || !response.ok) {
        throw new ServiceUnavailableError(
          "Groq Cloud generation failed across all configured models.",
          "AI_PROVIDER_ERROR"
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      };

      const rawContent = data.choices?.[0]?.message?.content || "{}";
      if (options?.jsonMode !== false) {
        return JsonSanitizer.extractJson(rawContent);
      }
      return rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new ServiceUnavailableError(
          `Groq request timed out after ${config.AI_TIMEOUT_MS}ms`,
          "AI_TIMEOUT"
        );
      }
      if (err instanceof ServiceUnavailableError) {
        throw err;
      }
      logger.error({ err }, "Groq Cloud provider error");
      throw new ServiceUnavailableError(
        "Groq AI service is currently unreachable.",
        "AI_PROVIDER_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
