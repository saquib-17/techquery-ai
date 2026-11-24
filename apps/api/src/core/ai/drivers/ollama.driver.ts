import { config } from "../../config/index.js";
import { logger } from "../../logger/index.js";
import { ServiceUnavailableError } from "../../errors/AppError.js";
import type { AIGatewayProvider, CompletionOptions, AIProviderId } from "../ai.types.js";

export class OllamaDriver implements AIGatewayProvider {
  public readonly id: AIProviderId = "OLLAMA";

  public async isHealthy(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${config.OLLAMA_BASE_URL}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.AI_TIMEOUT_MS);

    try {
      const payload: Record<string, unknown> = {
        model: config.AI_LOCAL_MODEL,
        prompt,
        stream: false,
        format: options?.jsonMode !== false ? "json" : undefined,
        options: {
          temperature: options?.temperature ?? 0.1,
          num_predict: options?.maxTokens ?? 2048,
        },
      };

      if (options?.systemPrompt) {
        payload.system = options.systemPrompt;
      }

      const response = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        logger.error({ status: response.status, errorText }, "Ollama generation failed");
        throw new ServiceUnavailableError(
          `Local Ollama generation returned status ${response.status}`,
          "AI_PROVIDER_ERROR"
        );
      }

      const data = (await response.json()) as { response?: string };
      return data.response || "{}";
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new ServiceUnavailableError(
          `Local Ollama request timed out after ${config.AI_TIMEOUT_MS}ms`,
          "AI_TIMEOUT"
        );
      }
      if (err instanceof ServiceUnavailableError) {
        throw err;
      }
      logger.error({ err }, "Failed to connect to local Ollama service");
      throw new ServiceUnavailableError(
        "Local Ollama service is unavailable. Please ensure 'ollama serve' is running or use mock mode.",
        "AI_PROVIDER_UNAVAILABLE"
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
