import type {
  AiTutorChatInput,
  AiTutorChatResponseDto,
  AiTutorContextType,
} from "@techquery/shared";
import { aiGateway, AIGateway } from "../../core/ai/ai.gateway.js";
import { config } from "../../core/config/index.js";
import {
  createGroqCompletion,
  sanitizeGroqMessages,
} from "../../lib/groqClient.js";

function buildContextGuidance(contextType: AiTutorContextType): string {
  switch (contextType) {
    case "DSA_PROBLEM":
    case "CODING_IDE":
      return [
        "- Guide the student with intuition, dry runs, and edge cases first.",
        "- If the student pastes code or a failing test case, pinpoint the exact logical bug without dumping the full solution code unless they explicitly ask for the full code.",
      ].join("\n");
    case "OA_REVIEW":
    case "STUDY_ROADMAP":
    case "RESUME_MATCH":
      return [
        "- Give concrete, prioritized, step-by-step advice directly grounded in the provided context summary.",
        "- Highlight what to fix or practice first and give a clear example.",
      ].join("\n");
    case "CS_TOPIC":
    default:
      return [
        "- Explain in simple, everyday English with short paragraphs, concrete real-life analogies, and clean code/ASCII examples when helpful.",
        "- If the student asks to be quizzed ('Quiz me'), ask 1 focused fresher interview question on this topic and wait for their answer before revealing the solution.",
      ].join("\n");
  }
}

function buildDeterministicFallback(input: AiTutorChatInput): string {
  const lastUserMsg =
    [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lower = lastUserMsg.toLowerCase();
  const title = input.contextTitle;
  const summarySnippet = input.contextSummary
    ? input.contextSummary.slice(0, 260).trim()
    : "";

  if (lower.includes("quiz")) {
    return `Quick Check on **${title}**:\n\nIn your own words, what problem does **${title}** solve, and what is one edge case or trade-off you should watch out for in an interview? Reply with your answer and I'll give you feedback!`;
  }

  if (lower.includes("analogy") || lower.includes("real-life")) {
    return `Here is an everyday analogy for **${title}**:\n\nThink of **${title}** like organizing a busy ticket counter—instead of letting everyone rush in at once or searching every folder from page 1, you put a clear rule or shortcut in place so the right item is handled quickly and safely.${summarySnippet ? `\n\nContext tie-in: ${summarySnippet}` : ""}`;
  }

  if (lower.includes("dry run") || lower.includes("step-by-step")) {
    return `Let's trace **${title}** step-by-step:\n\n1. **Start small:** Pick a tiny input or scenario first.\n2. **Track the state:** Write down what changes at each step (pointers, variables, or request flow).\n3. **Verify the end:** Check the boundary condition before returning.\n\nIf you share a specific input or step where you got stuck on **${title}**, I'll trace that exact step with you.`;
  }

  if (lower.includes("edge case") || lower.includes("break")) {
    return `Top edge cases to check for **${title}**:\n\n• Empty or minimum-size inputs (0, 1, or null values)\n• Duplicate values or already-sorted/reverse-sorted inputs\n• Extreme scale/limits (integer overflow, timeouts, or concurrent updates)\n\nWhich of these is failing in your test run?`;
  }

  if (lower.includes("hint") || lower.includes("fix first")) {
    return `Focused hint for **${title}**:\n\nLook closely at the core bottleneck described in the summary${summarySnippet ? ` ("${summarySnippet}...")` : ""}. Break it into one small invariant you must maintain on every step, and test that invariant on a 3-element example first.`;
  }

  return `Here is a simpler breakdown of **${title}**:\n\n${summarySnippet || `Focus on the core goal of ${title}: understand why it exists first, then walk through one small concrete example before memorizing any rules.`}\n\nAsk me if you'd like a real-life analogy, a step-by-step dry run, or a quick 1-question quiz on **${title}**!`;
}

function extractReply(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.reply === "string" && parsed.reply.trim()) {
        return parsed.reply.trim();
      }
    } catch {
      // not JSON, use raw string
    }
  }
  return trimmed;
}

export class AiTutorService {
  constructor(_ai: AIGateway = aiGateway) { }

  public async chat(
    _userId: string,
    input: AiTutorChatInput
  ): Promise<AiTutorChatResponseDto> {
    const apiKey = (
      process.env.GROQ_API_KEY !== undefined
        ? process.env.GROQ_API_KEY
        : config.GROQ_API_KEY || ""
    ).trim();

    // In offline test runs with no API key or Vitest test environment, use deterministic fallback
    if (config.NODE_ENV === "test" || !apiKey || config.AI_PROVIDER === "mock") {
      return {
        reply: buildDeterministicFallback(input),
        providerUsed: "FALLBACK",
      };
    }

    const trimmedSummary = (input.contextSummary ?? "").slice(0, 4000);

    const systemPrompt = [
      "You are an expert, encouraging, zero-jargon 1-on-1 AI Mentor helping a student master technical interviews and concepts.",
      `Context Type: ${input.contextType}`,
      `Topic / Problem: "${input.contextTitle}" (ID: ${input.contextId})`,
      trimmedSummary ? `Current Context Details:\n${trimmedSummary}` : "",
      "",
      "STRICT MENTOR RULES:",
      "1. DIRECTLY AND FULLY ANSWER THE USER'S EXACT QUESTION:",
      "   - If the user asks 'teach me day 1 from basics', teach Day 1 step-by-step with clear definitions, intuitive explanations, and a concrete example.",
      "   - If the user asks for a real-life analogy, provide an everyday intuitive analogy immediately.",
      "   - If the user asks why their code failed or asks for time complexity, analyze it directly with clear step-by-step reasoning.",
      "   - NEVER reply with a generic menu of options or evade the question.",
      "2. TEACHING STYLE & FORMATTING:",
      "   - Use clean, structured Markdown with bold titles, bullet points, numbered steps, and inline `code`.",
      "   - If including code, use standard markdown code blocks with the language tag (e.g. ```java or ```sql).",
      "   - Keep paragraphs focused, readable, and zero-jargon.",
      "   - Stay strictly scoped to this topic/context: if the user asks something completely unrelated, politely decline and guide them back.",
      buildContextGuidance(input.contextType),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const groqMessages = sanitizeGroqMessages(
        input.messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemPrompt
      );

      const result = await createGroqCompletion({
        messages: groqMessages,
        chainType: "fast",
        jsonMode: false,
        maxCompletionTokens: 1200,
        temperature: 0.2,
      });

      const reply = extractReply(result.content);
      return {
        reply,
        providerUsed: "GROQ",
      };
    } catch (err: any) {
      console.error("[ai-tutor] Groq error:", err?.message || err);
      return {
        reply:
          "The AI Mentor is experiencing high traffic across all models right now. Please wait a moment and try asking your question again.",
        providerUsed: "FALLBACK",
      };
    }
  }
}

export const aiTutorService = new AiTutorService();
