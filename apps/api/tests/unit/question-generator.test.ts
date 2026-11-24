import { describe, it, expect } from "vitest";
import {
  GenerateQuestionSetSchema,
  QuestionItemAISchema,
  QuestionSetAIResponseSchema,
  QuestionCategoryEnum,
  QuestionDifficultyEnum,
} from "../../src/modules/questions/question.schemas.js";
import { deterministicQuestionFallback } from "../../src/modules/questions/question.fallback.js";
import { PromptRegistry } from "../../src/core/ai/prompt.registry.js";
import { MockDriver } from "../../src/core/ai/drivers/mock.driver.js";

describe("Question Generator Unit Tests (Phase G)", () => {
  describe("Schema Validation (GenerateQuestionSetSchema)", () => {
    it("1. applies valid defaults when minimal input is provided", () => {
      const parsed = GenerateQuestionSetSchema.safeParse({});
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.count).toBe(10);
        expect(parsed.data.difficulty).toBe("MEDIUM");
        expect(parsed.data.topicFocus).toBe("Full-Stack & Core Software Engineering");
        expect(parsed.data.categories).toEqual([
          "THEORETICAL",
          "CODING",
          "SYSTEM_DESIGN",
          "BEHAVIORAL",
          "PROJECT_DEFENSE",
        ]);
        expect(parsed.data.resumeId).toBeUndefined();
        expect(parsed.data.jdId).toBeUndefined();
        expect(parsed.data.matchId).toBeUndefined();
      }
    });

    it("2. accepts valid custom inputs and coerces count", () => {
      const validUuid = "11111111-1111-4111-a111-111111111111";
      const parsed = GenerateQuestionSetSchema.safeParse({
        resumeId: validUuid,
        jdId: validUuid,
        matchId: validUuid,
        title: "Staff SDE System Design Prep",
        topicFocus: "Distributed Key-Value Stores",
        difficulty: "HARD",
        categories: ["SYSTEM_DESIGN", "CODING"],
        count: "15",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.count).toBe(15);
        expect(parsed.data.difficulty).toBe("HARD");
        expect(parsed.data.title).toBe("Staff SDE System Design Prep");
        expect(parsed.data.categories).toEqual(["SYSTEM_DESIGN", "CODING"]);
      }
    });

    it("3. rejects count out of bounds (below 3 or above 20)", () => {
      const tooLow = GenerateQuestionSetSchema.safeParse({ count: 2 });
      expect(tooLow.success).toBe(false);

      const tooHigh = GenerateQuestionSetSchema.safeParse({ count: 21 });
      expect(tooHigh.success).toBe(false);
    });

    it("4. rejects invalid difficulty or invalid category values", () => {
      const invalidDiff = GenerateQuestionSetSchema.safeParse({ difficulty: "IMPOSSIBLE" });
      expect(invalidDiff.success).toBe(false);

      const invalidCat = GenerateQuestionSetSchema.safeParse({ categories: ["TRIVIA"] });
      expect(invalidCat.success).toBe(false);

      const emptyCats = GenerateQuestionSetSchema.safeParse({ categories: [] });
      expect(emptyCats.success).toBe(false);
    });

    it("5. validates QuestionItemAISchema and QuestionSetAIResponseSchema correctly", () => {
      const validItem = {
        category: "THEORETICAL",
        difficulty: "MEDIUM",
        targetedSkill: "PostgreSQL Indexing",
        questionText: "How does a GiST index differ from a GIN index in PostgreSQL?",
        interviewerIntent: "Assesses understanding of specialized inverted indexing vs tree structures.",
        keyEvaluationPoints: ["Internal node layout", "Full-text search query planning"],
      };

      expect(QuestionItemAISchema.safeParse(validItem).success).toBe(true);

      const validResponse = {
        title: "PostgreSQL Specialized Prep",
        questions: [validItem],
      };
      expect(QuestionSetAIResponseSchema.safeParse(validResponse).success).toBe(true);

      const emptyResponse = {
        title: "Invalid Set",
        questions: [],
      };
      expect(QuestionSetAIResponseSchema.safeParse(emptyResponse).success).toBe(false);
    });
  });

  describe("Deterministic Fallback (deterministicQuestionFallback)", () => {
    it("6. generates exact requested question count across requested categories and difficulty", () => {
      const result = deterministicQuestionFallback({
        count: 5,
        difficulty: "HARD",
        categories: ["SYSTEM_DESIGN", "PROJECT_DEFENSE"],
        skills: ["Kafka", "Cassandra"],
        topicFocus: "Real-time Event Streaming",
      });

      expect(result.questions.length).toBe(5);
      expect(result.title).toContain("Real-time Event Streaming");

      for (const q of result.questions) {
        expect(q.difficulty).toBe("HARD");
        expect(["SYSTEM_DESIGN", "PROJECT_DEFENSE"]).toContain(q.category);
        expect(["Kafka", "Cassandra"]).toContain(q.targetedSkill);
        expect(q.questionText.length).toBeGreaterThan(20);
        expect(q.interviewerIntent.length).toBeGreaterThan(10);
        expect(q.keyEvaluationPoints.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("7. generates standard 10-question set with default skills if none provided", () => {
      const result = deterministicQuestionFallback({});

      expect(result.questions.length).toBe(10);
      expect(result.title).toBeDefined();

      const categoriesFound = new Set(result.questions.map((q) => q.category));
      expect(categoriesFound.size).toBe(5); // cycles through all 5 categories
    });
  });

  describe("Prompt Registry & Anti-Prompt-Injection", () => {
    it("8. wraps resume, JD, and match in explicit untrusted XML context tags", () => {
      const prompt = PromptRegistry.buildQuestionGenPrompt({
        resumeText: "Candidate experience with React and Node.js",
        jdTitle: "Senior Full Stack Engineer",
        jdCompany: "FinTech Corp",
        jdText: "Requirements: 5+ years building financial dashboards",
        matchedSkills: ["Node.js", "React"],
        missingSkills: [{ skill: "Kubernetes", importance: "HIGH" }],
        topicFocus: "Financial Microservices",
        difficulty: "MEDIUM",
        categories: ["THEORETICAL", "CODING", "SYSTEM_DESIGN", "BEHAVIORAL", "PROJECT_DEFENSE"],
        count: 10,
      });

      expect(prompt).toContain("<resume_context>");
      expect(prompt).toContain("Candidate experience with React and Node.js");
      expect(prompt).toContain("</resume_context>");

      expect(prompt).toContain("<job_description_context>");
      expect(prompt).toContain("Role: Senior Full Stack Engineer at FinTech Corp");
      expect(prompt).toContain("</job_description_context>");

      expect(prompt).toContain("<match_context>");
      expect(prompt).toContain("Matched Skills: Node.js, React");
      expect(prompt).toContain("Identified Skill Gaps: Kubernetes (HIGH)");
      expect(prompt).toContain("</match_context>");

      expect(prompt).toContain("SECURITY DIRECTIVE:");
      expect(prompt).toContain("UNTRUSTED user input");
      expect(prompt).toContain("Generate exactly 10 questions");
    });
  });

  describe("Mock Driver (generateMockQuestionSet)", () => {
    it("9. produces schema-valid QuestionSetAIResponse matching prompt count and parameters", async () => {
      const driver = new MockDriver();
      const prompt = `
        Topic Focus: Cloud Architecture
        Target Difficulty: HARD
        Allowed Categories: SYSTEM_DESIGN, CODING
        Total Questions Required: Generate exactly 6 questions.
        <match_context>
        Matched Skills: Docker, AWS, PostgreSQL
        </match_context>
      `;

      const rawJson = await driver.complete(prompt, { taskType: "QGEN" });
      const parsed = JSON.parse(rawJson);

      const validation = QuestionSetAIResponseSchema.safeParse(parsed);
      expect(validation.success).toBe(true);

      if (validation.success) {
        expect(validation.data.questions.length).toBe(6);
        for (const q of validation.data.questions) {
          expect(q.difficulty).toBe("HARD");
          expect(["SYSTEM_DESIGN", "CODING"]).toContain(q.category);
          expect(q.keyEvaluationPoints.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });
});
