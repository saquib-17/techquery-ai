import { config } from "../../config/index.js";
import type { AIGatewayProvider, CompletionOptions, AIProviderId } from "../ai.types.js";
import {
  createGroqCompletion,
  type GroqChainType,
} from "../../../lib/groqClient.js";

export class GroqDriver implements AIGatewayProvider {
  public readonly id: AIProviderId = "GROQ";

  public async isHealthy(): Promise<boolean> {
    return Boolean(config.GROQ_API_KEY && config.GROQ_API_KEY.trim().length > 0);
  }

  public async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const chainType: GroqChainType =
      options?.taskType === "AGEN" &&
      typeof (options as any)?.rawInputText === "string" &&
      (options as any).rawInputText.toLowerCase().includes("tutor")
        ? "fast"
        : "heavy";

    const result = await createGroqCompletion(prompt, {
      systemPrompt: options?.systemPrompt,
      chainType,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      jsonMode: options?.jsonMode,
    });

    return result.content;
  }
}
