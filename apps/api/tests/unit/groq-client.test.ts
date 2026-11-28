import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  createGroqCompletion,
  createGroqStructured,
  getGroqModelChain,
  sanitizeGroqMessages,
} from "../../src/lib/groqClient.js";

describe("Centralized Groq Waterfall Client (V2.8)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.GROQ_API_KEY = "gsk_test_mock_key_12345";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("getGroqModelChain", () => {
    it("returns heavy chain with ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']", () => {
      delete process.env.GROQ_MODEL;
      const chain = getGroqModelChain("heavy");
      expect(chain).toEqual([
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
      ]);
    });

    it("returns fast tutor chain with ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b']", () => {
      delete process.env.GROQ_TUTOR_MODEL;
      delete process.env.GROQ_MODEL;
      const chain = getGroqModelChain("fast");
      expect(chain).toEqual([
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
      ]);
    });

    it("respects process.env.GROQ_TUTOR_MODEL as highest priority for fast tutor chain", () => {
      process.env.GROQ_TUTOR_MODEL = "custom/fast-tutor-model";
      const chain = getGroqModelChain("fast");
      expect(chain[0]).toBe("custom/fast-tutor-model");
      expect(chain).toContain("openai/gpt-oss-20b");
      expect(chain).toContain("qwen/qwen3.8-27b");
    });

    it("filters out non-chat classifier models like llama-prompt-guard-2", () => {
      process.env.GROQ_MODEL = "meta-llama/llama-prompt-guard-2-86m";
      const chain = getGroqModelChain("heavy");
      expect(chain).not.toContain("meta-llama/llama-prompt-guard-2-86m");
      expect(chain[0]).toBe("openai/gpt-oss-120b");
    });
  });

  describe("sanitizeGroqMessages", () => {
    it("prepends system prompt and combines consecutive same-role messages", () => {
      const sanitized = sanitizeGroqMessages(
        [
          { role: "user", content: "Part 1" },
          { role: "user", content: "Part 2" },
          { role: "assistant", content: "Answer" },
          { role: "user", content: "Follow-up" },
        ],
        "System context"
      );

      expect(sanitized).toHaveLength(4);
      expect(sanitized[0]).toEqual({ role: "system", content: "System context" });
      expect(sanitized[1]).toEqual({ role: "user", content: "Part 1\n\nPart 2" });
      expect(sanitized[2]).toEqual({ role: "assistant", content: "Answer" });
      expect(sanitized[3]).toEqual({ role: "user", content: "Follow-up" });
    });

    it("filters out empty messages and ensures user starts after system", () => {
      const sanitized = sanitizeGroqMessages([
        { role: "assistant", content: "Initial greeting" },
        { role: "user", content: "" },
        { role: "user", content: "My question" },
      ]);

      expect(sanitized[0]?.role).toBe("user");
      expect(sanitized).toContainEqual({ role: "assistant", content: "Initial greeting" });
      expect(sanitized).toContainEqual({ role: "user", content: "My question" });
    });
  });

  describe("createGroqCompletion Waterfall & Failover", () => {
    it("throws ServiceUnavailableError if GROQ_API_KEY is missing", async () => {
      process.env.GROQ_API_KEY = "";
      const fetchSpy = vi.spyOn(global, "fetch");

      await expect(
        createGroqCompletion({ prompt: "Hello" })
      ).rejects.toThrow("GROQ_API_KEY is not configured");

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("succeeds on first model when response is 200 OK with content", async () => {
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: '{"answer": "ok"}' },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const result = await createGroqCompletion({
        prompt: "Say hi",
        chainType: "heavy",
      });

      expect(result.modelUsed).toBe("openai/gpt-oss-120b");
      expect(result.content).toBe('{"answer": "ok"}');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const requestBody = JSON.parse(
        (fetchSpy.mock.calls[0]![1] as RequestInit).body as string
      );
      expect(requestBody.model).toBe("openai/gpt-oss-120b");
    });

    it("automatically fails over from primary model to second model ('openai/gpt-oss-20b') on 429 rate limit", async () => {
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi
        .spyOn(global, "fetch")
        // 1st call (openai/gpt-oss-120b): 429 Rate Limit
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: {
                message: "Rate limit reached for model openai/gpt-oss-120b",
                type: "tokens",
                code: "rate_limit_exceeded",
              },
            }),
            { status: 429, headers: { "Content-Type": "application/json" } }
          )
        )
        // 2nd call (openai/gpt-oss-20b): 200 OK
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: { content: '{"status": "recovered"}' },
                  finish_reason: "stop",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );

      const result = await createGroqCompletion({
        prompt: "Need help",
        chainType: "heavy",
      });

      expect(result.modelUsed).toBe("openai/gpt-oss-20b");
      expect(result.content).toBe('{"status": "recovered"}');
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      const firstCallBody = JSON.parse(
        (fetchSpy.mock.calls[0]![1] as RequestInit).body as string
      );
      const secondCallBody = JSON.parse(
        (fetchSpy.mock.calls[1]![1] as RequestInit).body as string
      );
      expect(firstCallBody.model).toBe("openai/gpt-oss-120b");
      expect(secondCallBody.model).toBe("openai/gpt-oss-20b");
    });

    it("fails over to third model ('qwen/qwen3.8-27b') if both first and second return 429", async () => {
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi
        .spyOn(global, "fetch")
        // 1st: 429
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "429 Rate limit" }), {
            status: 429,
          })
        )
        // 2nd: 429
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "429 Rate limit" }), {
            status: 429,
          })
        )
        // 3rd (qwen/qwen3.8-27b): 200 OK
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [
                {
                  message: { content: '{"model": "qwen-success"}' },
                  finish_reason: "stop",
                },
              ],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );

      const result = await createGroqCompletion({
        prompt: "Deep question",
        chainType: "heavy",
      });

      expect(result.modelUsed).toBe("qwen/qwen3.8-27b");
      expect(result.content).toBe('{"model": "qwen-success"}');
      expect(fetchSpy).toHaveBeenCalledTimes(3);

      const thirdCallBody = JSON.parse(
        (fetchSpy.mock.calls[2]![1] as RequestInit).body as string
      );
      expect(thirdCallBody.model).toBe("qwen/qwen3.8-27b");
    });

    it("fails over on 502/503/504 transient gateway errors and empty content", async () => {
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi
        .spyOn(global, "fetch")
        // 1st: 503 Service Unavailable
        .mockResolvedValueOnce(new Response("Service Unavailable", { status: 503 }))
        // 2nd: 200 OK but empty choices content
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: "   " } }],
            }),
            { status: 200 }
          )
        )
        // 3rd: 200 OK with content
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: '{"recovered": true}' } }],
            }),
            { status: 200 }
          )
        );

      const result = await createGroqCompletion({
        prompt: "Query",
        chainType: "heavy",
      });

      expect(result.modelUsed).toBe("qwen/qwen3.8-27b");
      expect(result.content).toBe('{"recovered": true}');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it("throws ServiceUnavailableError when all 3 models in the chain fail", async () => {
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValueOnce(new Response("429", { status: 429 }))
        .mockResolvedValueOnce(new Response("429", { status: 429 }))
        .mockResolvedValueOnce(new Response("429", { status: 429 }));

      await expect(
        createGroqCompletion({ prompt: "Fail all", chainType: "heavy" })
      ).rejects.toThrow("Groq Cloud generation failed across all configured models");

      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it("fast tutor chain starts with 'openai/gpt-oss-20b' and fails over to 'openai/gpt-oss-120b'", async () => {
      delete process.env.GROQ_TUTOR_MODEL;
      delete process.env.GROQ_MODEL;
      const fetchSpy = vi
        .spyOn(global, "fetch")
        // 1st call for tutor is gpt-oss-20b: returns 429
        .mockResolvedValueOnce(new Response("429", { status: 429 }))
        // 2nd call is gpt-oss-120b: returns 200 OK
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [{ message: { content: '{"reply": "Mentor advice"}' } }],
            }),
            { status: 200 }
          )
        );

      const result = await createGroqCompletion({
        prompt: "Tutor doubt",
        chainType: "fast",
      });

      expect(result.modelUsed).toBe("openai/gpt-oss-120b");
      expect(result.content).toBe('{"reply": "Mentor advice"}');

      const firstCallBody = JSON.parse(
        (fetchSpy.mock.calls[0]![1] as RequestInit).body as string
      );
      expect(firstCallBody.model).toBe("openai/gpt-oss-20b");
    });
  });

  describe("createGroqStructured", () => {
    const TestSchema = z.object({
      summary: z.string().min(1),
    });

    it("validates and parses schema directly from Groq output", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: '{"summary": "Structured success"}' },
              },
            ],
          }),
          { status: 200 }
        )
      );

      const result = await createGroqStructured(TestSchema, {
        prompt: "Give summary",
        forceGroq: true,
        fallbackFn: () => ({ summary: "fallback" }),
      });

      expect(result.success).toBe(true);
      expect(result.data.summary).toBe("Structured success");
      expect(result.providerUsed).toBe("GROQ");
    });

    it("executes fallbackFn if all Groq calls fail", async () => {
      vi.spyOn(global, "fetch")
        .mockResolvedValueOnce(new Response("429", { status: 429 }))
        .mockResolvedValueOnce(new Response("429", { status: 429 }))
        .mockResolvedValueOnce(new Response("429", { status: 429 }));

      const result = await createGroqStructured(TestSchema, {
        prompt: "Failing prompt",
        forceGroq: true,
        fallbackFn: () => ({ summary: "safe fallback executed" }),
      });

      expect(result.success).toBe(true);
      expect(result.data.summary).toBe("safe fallback executed");
      expect(result.providerUsed).toBe("FALLBACK");
    });
  });
});
