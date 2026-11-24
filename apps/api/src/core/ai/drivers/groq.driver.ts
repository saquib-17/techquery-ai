import { config } from "../../config/index.js";
import { logger } from "../../logger/index.js";
import { ServiceUnavailableError } from "../../errors/AppError.js";
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

      const payload: Record<string, unknown> = {
        model: config.GROQ_MODEL,
        messages,
        temperature: options?.temperature ?? 0.1,
        max_tokens: options?.maxTokens ?? 2048,
        response_format: options?.jsonMode !== false ? { type: "json_object" } : undefined,
      };

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new ServiceUnavailableError(
          "Groq Cloud free-tier rate limit exceeded. Please try again shortly.",
          "AI_RATE_LIMIT"
        );
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        logger.error({ status: response.status, errorText }, "Groq generation failed");
        throw new ServiceUnavailableError(
          `Groq Cloud generation returned status ${response.status}`,
          "AI_PROVIDER_ERROR"
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return data.choices?.[0]?.message?.content || "{}";
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
