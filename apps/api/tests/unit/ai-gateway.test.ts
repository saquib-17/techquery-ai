import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { JsonSanitizer } from "../../src/core/ai/json-sanitizer.js";
import { AIGateway } from "../../src/core/ai/ai.gateway.js";
import { OllamaDriver } from "../../src/core/ai/drivers/ollama.driver.js";
import { GroqDriver } from "../../src/core/ai/drivers/groq.driver.js";
import { MockDriver } from "../../src/core/ai/drivers/mock.driver.js";
import { ServiceUnavailableError } from "../../src/core/errors/AppError.js";
import type { AIGatewayProvider } from "../../src/core/ai/ai.types.js";

describe("Centralized AI Gateway Unit Tests", () => {
  describe("1. JsonSanitizer", () => {
    it("extracts pure JSON from clean string", () => {
      const input = '{"name": "TechQuery", "score": 95}';
      const output = JsonSanitizer.extractJson(input);
      expect(output).toBe('{"name": "TechQuery", "score": 95}');
      expect(JSON.parse(output)).toEqual({ name: "TechQuery", score: 95 });
    });

    it("strips markdown json code fences (```json ... ```)", () => {
      const input = '```json\n{\n  "status": "ok",\n  "count": 42\n}\n```';
      const output = JsonSanitizer.extractJson(input);
      expect(JSON.parse(output)).toEqual({ status: "ok", count: 42 });
    });

    it("strips generic markdown fences (``` ... ```)", () => {
      const input = '```\n{"active": true}\n```';
      const output = JsonSanitizer.extractJson(input);
      expect(JSON.parse(output)).toEqual({ active: true });
    });

    it("extracts JSON surrounded by conversational text", () => {
      const input =
        'Certainly! Here is the requested analysis:\n\n{"atsScore": 82, "recommendation": "hire"}\n\nHope this helps your evaluation!';
      const output = JsonSanitizer.extractJson(input);
      expect(JSON.parse(output)).toEqual({ atsScore: 82, recommendation: "hire" });
    });

    it("extracts JSON arrays correctly", () => {
      const input = 'Here are the skills: ["TypeScript", "Node.js", "PostgreSQL"]';
      const output = JsonSanitizer.extractJson(input);
      expect(JSON.parse(output)).toEqual(["TypeScript", "Node.js", "PostgreSQL"]);
    });

    it("handles empty or invalid strings safely", () => {
      expect(JsonSanitizer.extractJson("")).toBe("{}");
      expect(JsonSanitizer.extractJson(null as any)).toBe("{}");
      expect(JsonSanitizer.extractJson("No json here at all")).toBe("No json here at all");
    });
  });

  describe("2. MockDriver", () => {
    const driver = new MockDriver();

    it("has id MOCK and isHealthy returns true", async () => {
      expect(driver.id).toBe("MOCK");
      expect(await driver.isHealthy()).toBe(true);
    });

    it("returns schema-valid ATS_AUDIT payload reflecting input skills", async () => {
      const prompt = "Candidate resume with extensive TypeScript, Node.js, and PostgreSQL experience";
      const res = await driver.complete(prompt, { taskType: "ATS_AUDIT" });
      const parsed = JSON.parse(res);

      expect(parsed.atsScore).toBeGreaterThanOrEqual(60);
      expect(parsed.atsScore).toBeLessThanOrEqual(100);
      expect(parsed.sectionScores).toBeDefined();
      expect(parsed.sectionScores.contact).toBeGreaterThan(0);
      expect(parsed.strengths.length).toBeGreaterThan(0);
      expect(parsed.improvements.length).toBeGreaterThan(0);
      expect(parsed.improvements[0].reason).toContain("Google X-Y-Z");
    });

    it("returns schema-valid RESUME_PARSE payload", async () => {
      const prompt = "Experienced React and Python developer building web applications";
      const res = await driver.complete(prompt, { taskType: "RESUME_PARSE" });
      const parsed = JSON.parse(res);

      expect(parsed.summary).toBeDefined();
      expect(parsed.skills.technical).toBeDefined();
      expect(parsed.skills.technical).toContain("React");
      expect(parsed.skills.technical).toContain("Python");
      expect(parsed.experience.length).toBeGreaterThan(0);
      expect(parsed.projects.length).toBeGreaterThan(0);
    });
  });

  describe("3. AIGateway Auto-Repair Loop & Fallbacks", () => {
    const TestSchema = z.object({
      atsScore: z.number().int().min(0).max(100),
      summary: z.string(),
    });

    type TestType = z.infer<typeof TestSchema>;

    it("returns structured result on first-attempt validation success", async () => {
      const gateway = new AIGateway();
      const mockProvider: AIGatewayProvider = {
        id: "MOCK",
        isHealthy: async () => true,
        complete: async () => JSON.stringify({ atsScore: 88, summary: "Excellent profile" }),
      };

      vi.spyOn(gateway, "getActiveProvider").mockReturnValue(mockProvider);

      const result = await gateway.completeStructured<TestType>(
        "Test prompt",
        TestSchema,
        { taskType: "ATS_AUDIT" }
      );

      expect(result.success).toBe(true);
      expect(result.isFallback).toBe(false);
      expect(result.providerUsed).toBe("MOCK");
      expect(result.data.atsScore).toBe(88);
      expect(result.data.summary).toBe("Excellent profile");
    });

    it("recovers via 1-turn auto-repair when attempt 1 fails and attempt 2 succeeds", async () => {
      const gateway = new AIGateway();
      let callCount = 0;

      const mockProvider: AIGatewayProvider = {
        id: "MOCK",
        isHealthy: async () => true,
        complete: async () => {
          callCount++;
          if (callCount === 1) {
            // First attempt: invalid schema (string instead of number for atsScore)
            return JSON.stringify({ atsScore: "not_a_number", summary: "Broken" });
          }
          // Second attempt (repair turn): valid schema
          return JSON.stringify({ atsScore: 92, summary: "Repaired successfully" });
        },
      };

      vi.spyOn(gateway, "getActiveProvider").mockReturnValue(mockProvider);

      const result = await gateway.completeStructured<TestType>(
        "Prompt that breaks first",
        TestSchema,
        { taskType: "ATS_AUDIT" }
      );

      expect(callCount).toBe(2);
      expect(result.success).toBe(true);
      expect(result.isFallback).toBe(false);
      expect(result.data.atsScore).toBe(92);
      expect(result.data.summary).toBe("Repaired successfully");
    });

    it("executes deterministic fallback when auto-repair also fails", async () => {
      const gateway = new AIGateway();

      const mockProvider: AIGatewayProvider = {
        id: "MOCK",
        isHealthy: async () => true,
        complete: async () => "Totally unparseable garbage text on all attempts",
      };

      vi.spyOn(gateway, "getActiveProvider").mockReturnValue(mockProvider);

      const fallbackFn = (rawText: string): TestType => ({
        atsScore: 70,
        summary: `Fallback generated from ${rawText.substring(0, 10)}`,
      });

      const result = await gateway.completeStructured<TestType>(
        "Prompt that always fails",
        TestSchema,
        {
          taskType: "ATS_AUDIT",
          fallbackFn,
          rawInputText: "Original candidate raw resume text",
        }
      );

      expect(result.success).toBe(true);
      expect(result.isFallback).toBe(true);
      expect(result.providerUsed).toBe("FALLBACK");
      expect(result.data.atsScore).toBe(70);
      expect(result.data.summary).toContain("Fallback generated");
    });
  });

  describe("4. Ollama & Groq Drivers Error Handling", () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("OllamaDriver throws ServiceUnavailableError when server returns 500", async () => {
      const driver = new OllamaDriver();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Ollama Error",
      } as any);

      await expect(driver.complete("Test prompt")).rejects.toThrow(ServiceUnavailableError);
    });

    it("OllamaDriver throws ServiceUnavailableError on connection failure / network error", async () => {
      const driver = new OllamaDriver();
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(driver.complete("Test prompt")).rejects.toThrow(ServiceUnavailableError);
    });

    it("GroqDriver throws ServiceUnavailableError on HTTP 429 rate limit", async () => {
      const driver = new GroqDriver();
      // Temporarily mock API key
      const { config } = await import("../../src/core/config/index.js");
      (config as any).GROQ_API_KEY = "mock_groq_key_for_test";

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      } as any);

      await expect(driver.complete("Test prompt")).rejects.toThrow(ServiceUnavailableError);
    });
  });

  describe("5. Deterministic Resume Heuristics & Fallbacks", () => {
    it("deterministicParseResume generates valid structured career data from raw text", async () => {
      const { deterministicParseResume } = await import(
        "../../src/modules/resume/resume-intelligence.fallback.js"
      );
      const text = `
        Jane Doe
        Email: jane@example.com Phone: 555-123-4567
        GitHub: github.com/janedoe LinkedIn: linkedin.com/in/janedoe
        Skills: TypeScript, Node.js, React, PostgreSQL, Docker, Git.
        Experience:
        Software Engineer at Acme Corp (2022 - Present)
        - Developed backend services with TypeScript and PostgreSQL.
        Education:
        B.Tech in Computer Science from State University
      `;

      const parsed = deterministicParseResume(text);
      expect(parsed.skills.technical).toContain("TypeScript");
      expect(parsed.skills.technical).toContain("PostgreSQL");
      expect(parsed.experience.length).toBeGreaterThan(0);
      expect(parsed.education.length).toBeGreaterThan(0);
      expect(parsed.summary).toBeDefined();
    });

    it("deterministicAtsAudit scores resume and identifies missing sections", async () => {
      const { deterministicAtsAudit } = await import(
        "../../src/modules/resume/resume-intelligence.fallback.js"
      );
      const textWithLinks = `
        Jane Doe
        Email: jane@example.com Phone: 555-123-4567
        GitHub: github.com/janedoe LinkedIn: linkedin.com/in/janedoe
        Experience: Software Engineer at BigCo
        Skills: TypeScript, Node.js, React, PostgreSQL, Docker, Git
        Education: Bachelor of Science in CS
      `;

      const audit = deterministicAtsAudit(textWithLinks);
      expect(audit.atsScore).toBeGreaterThan(60);
      expect(audit.sectionScores.contact).toBe(100);
      expect(audit.strengths.length).toBeGreaterThan(0);
      expect(audit.improvements.length).toBeGreaterThan(0);

      // Incomplete text lacking links
      const textNoLinks = "Just plain text without email or links";
      const incompleteAudit = deterministicAtsAudit(textNoLinks);
      expect(incompleteAudit.sectionScores.contact).toBe(0);
      expect(incompleteAudit.issues.some((i) => i.includes("GitHub"))).toBe(true);
      expect(incompleteAudit.issues.some((i) => i.includes("LinkedIn"))).toBe(true);
    });
  });
});
