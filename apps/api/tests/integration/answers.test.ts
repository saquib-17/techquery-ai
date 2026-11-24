import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { aiGateway } from "../../src/core/ai/ai.gateway.js";

describe("Model Answer Generation API Integration Tests (Phase H)", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user1TechnicalQuestionId: string;
  let user1BehavioralQuestionId: string;
  let user1QuestionSetId: string;

  let user2Token: string;
  let user2Id: string;
  let user2TechnicalQuestionId: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    // 1. Create User 1
    const u1 = await prisma.user.create({
      data: {
        name: "Answer Candidate One",
        email: "candidate1.answers@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({
      userId: u1.id,
      role: u1.role,
      tier: u1.tier,
    });

    // Create User 1 Question Set with a technical and a behavioral question
    const qs1 = await prisma.questionSet.create({
      data: {
        userId: user1Id,
        title: "Full Stack SDE Practice",
        topicFocus: "PostgreSQL & Distributed Systems",
        difficulty: "MEDIUM",
        totalCount: 2,
        providerUsed: "MOCK",
        questions: {
          create: [
            {
              category: "CODING",
              difficulty: "MEDIUM",
              targetedSkill: "TypeScript",
              questionText: "Implement a thread-safe stream batch processor with deduplication.",
              interviewerIntent: "Evaluates algorithmic efficiency and memory management.",
              keyEvaluationPoints: ["Hash set lookups", "O(N) time complexity"],
            },
            {
              category: "BEHAVIORAL",
              difficulty: "MEDIUM",
              targetedSkill: "Cross-Team Collaboration",
              questionText: "Tell me about a time you resolved a major production deadlock under pressure.",
              interviewerIntent: "Assesses communication, ownership, and composure.",
              keyEvaluationPoints: ["STAR structure", "Quantifiable impact"],
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });

    user1QuestionSetId = qs1.id;
    const codingQ = qs1.questions.find((q) => q.category === "CODING");
    const behavioralQ = qs1.questions.find((q) => q.category === "BEHAVIORAL");
    user1TechnicalQuestionId = codingQ!.id;
    user1BehavioralQuestionId = behavioralQ!.id;

    // 2. Create User 2
    const u2 = await prisma.user.create({
      data: {
        name: "Answer Candidate Two",
        email: "candidate2.answers@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({
      userId: u2.id,
      role: u2.role,
      tier: u2.tier,
    });

    const qs2 = await prisma.questionSet.create({
      data: {
        userId: user2Id,
        title: "User 2 Questions",
        topicFocus: "Go & Microservices",
        difficulty: "HARD",
        totalCount: 1,
        providerUsed: "MOCK",
        questions: {
          create: [
            {
              category: "SYSTEM_DESIGN",
              difficulty: "HARD",
              targetedSkill: "Go Channels",
              questionText: "Design a worker pool using Go channels.",
              interviewerIntent: "Assesses concurrency primitives.",
              keyEvaluationPoints: ["Goroutine lifecycle"],
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });
    user2TechnicalQuestionId = qs2.questions[0].id;
  });

  describe("POST /api/v1/answers/generate", () => {
    it("1. generates a model answer for a technical question (201 Created)", async () => {
      const res = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();

      const ans = res.body.data.answer;
      expect(ans.questionId).toBe(user1TechnicalQuestionId);
      expect(ans.shortSummary.length).toBeGreaterThan(10);
      expect(ans.detailedExplanation.length).toBeGreaterThan(20);
      expect(ans.codeSnippet).not.toBeNull();
      expect(ans.timeComplexity).toBe("O(N)");
      expect(ans.spaceComplexity).toBe("O(N)");
      expect(ans.commonMistakes.length).toBeGreaterThanOrEqual(1);
      expect(ans.style).toBe("INTERVIEW");
      expect(ans.providerUsed).toBe("MOCK");
    });

    it("2. generates a STAR-formatted answer for a BEHAVIORAL question with null complexity (201 Created)", async () => {
      const res = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1BehavioralQuestionId,
          style: "INTERVIEW",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const ans = res.body.data.answer;
      expect(ans.questionId).toBe(user1BehavioralQuestionId);
      expect(ans.codeSnippet).toBeNull();
      expect(ans.timeComplexity).toBeNull();
      expect(ans.spaceComplexity).toBeNull();
      expect(ans.detailedExplanation).toContain("**Situation**:");
      expect(ans.detailedExplanation).toContain("**Task**:");
      expect(ans.detailedExplanation).toContain("**Action**:");
      expect(ans.detailedExplanation).toContain("**Result**:");
    });

    it("3. returns cached answer on subsequent requests when regenerate is false (200 OK)", async () => {
      // First generation: 201 Created
      const firstRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
        });
      expect(firstRes.status).toBe(201);
      const firstAnswerId = firstRes.body.data.answer.id;

      // Second generation without regenerate flag: 200 OK with identical answer ID
      const secondRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
          regenerate: false,
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.success).toBe(true);
      expect(secondRes.body.data.answer.id).toBe(firstAnswerId);
    });

    it("4. updates existing answer when regenerate: true is passed (200 OK)", async () => {
      // First generation
      const firstRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
        });
      expect(firstRes.status).toBe(201);

      // Regenerate
      const regenRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
          regenerate: true,
        });

      expect(regenRes.status).toBe(200);
      expect(regenRes.body.success).toBe(true);
      expect(regenRes.body.data.answer.questionId).toBe(user1TechnicalQuestionId);
    });

    it("5. updates existing answer when style is changed from INTERVIEW to CONCISE (200 OK)", async () => {
      // First generation in INTERVIEW style
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "INTERVIEW",
        });

      // Style changed to CONCISE
      const styleRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId: user1TechnicalQuestionId,
          style: "CONCISE",
        });

      expect(styleRes.status).toBe(200);
      expect(styleRes.body.data.answer.style).toBe("CONCISE");
    });
  });

  describe("GET /api/v1/answers/:questionId", () => {
    it("6. retrieves persisted answer by questionId (200 OK)", async () => {
      // Generate answer first
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      const getRes = await request(app)
        .get(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.answer.questionId).toBe(user1TechnicalQuestionId);
    });

    it("7. returns 404 when answer has not yet been generated for the question", async () => {
      const res = await request(app)
        .get(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ANSWER_NOT_FOUND");
    });
  });

  describe("DELETE /api/v1/answers/:questionId", () => {
    it("8. deletes answer and subsequent GET returns 404 (200 OK)", async () => {
      // Generate answer
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      // Delete answer
      const delRes = await request(app)
        .delete(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify subsequent GET returns 404
      const getRes = await request(app)
        .get(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(404);
    });

    it("9. returns 404 when attempting to delete a non-existent answer", async () => {
      const delRes = await request(app)
        .delete(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(404);
      expect(delRes.body.error.code).toBe("ANSWER_NOT_FOUND");
    });
  });

  describe("Question Set Relationship & Population", () => {
    it("10. includes nested answer on questions when retrieving question set by ID", async () => {
      // Generate answer for technical question
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      const qsRes = await request(app)
        .get(`/api/v1/questions/${user1QuestionSetId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(qsRes.status).toBe(200);
      const questions = qsRes.body.data.questionSet.questions;
      const techQ = questions.find((q: any) => q.id === user1TechnicalQuestionId);
      const behQ = questions.find((q: any) => q.id === user1BehavioralQuestionId);

      expect(techQ.answer).toBeDefined();
      expect(techQ.answer.questionId).toBe(user1TechnicalQuestionId);
      expect(behQ.answer).toBeNull();
    });
  });

  describe("BOLA / IDOR Security Isolation", () => {
    it("11. User 2 cannot generate an answer for User 1's question (404 Not Found)", async () => {
      const res = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("QUESTION_NOT_FOUND");
    });

    it("12. User 2 cannot read User 1's generated answer (404 Not Found)", async () => {
      // User 1 generates answer
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      // User 2 attempts to fetch it
      const res = await request(app)
        .get(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ANSWER_NOT_FOUND");
    });

    it("13. User 2 cannot delete User 1's generated answer (404 Not Found)", async () => {
      // User 1 generates answer
      await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      // User 2 attempts to delete it
      const res = await request(app)
        .delete(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ANSWER_NOT_FOUND");

      // Verify answer still exists for User 1
      const getRes = await request(app)
        .get(`/api/v1/answers/${user1TechnicalQuestionId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(getRes.status).toBe(200);
    });
  });

  describe("Offline Fallback & Error Handling", () => {
    it("14. executes deterministic fallback when AI Gateway throws an outage error (201 Created)", async () => {
      const completeStructuredSpy = vi.spyOn(aiGateway, "completeStructured");
      completeStructuredSpy.mockImplementationOnce(
        async (_prompt: string, _schema: any, context: any) => {
          const fallbackData = context.fallbackFn();
          return {
            success: true,
            data: fallbackData,
            providerUsed: "FALLBACK",
            modelName: "deterministic-answer-fallback",
            latencyMs: 1,
            isFallback: true,
          };
        }
      );

      const res = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1TechnicalQuestionId });

      expect(res.status).toBe(201);
      expect(res.body.data.answer.providerUsed).toBe("FALLBACK");
      expect(res.body.data.answer.codeSnippet).not.toBeNull();

      completeStructuredSpy.mockRestore();
    });

    it("15. returns 401 Unauthorized when request lacks Bearer token", async () => {
      const res = await request(app)
        .post("/api/v1/answers/generate")
        .send({ questionId: user1TechnicalQuestionId });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_HEADER_MISSING");
    });

    it("16. returns 400 Bad Request on invalid questionId UUID", async () => {
      const res = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: "not-a-valid-uuid" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
