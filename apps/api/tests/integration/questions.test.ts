import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { aiGateway } from "../../src/core/ai/ai.gateway.js";

describe("AI Interview Question Generation API Integration Tests (Phase G)", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user1ResumeId: string;
  let user1JdId: string;
  let user1MatchId: string;

  let user2Token: string;
  let user2Id: string;
  let user2ResumeId: string;
  let user2JdId: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    // Create User 1
    const u1 = await prisma.user.create({
      data: {
        name: "Question Prep User 1",
        email: "user1.questions@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({ userId: u1.id, role: u1.role, tier: u1.tier });

    // Create User 1 Resume
    const r1 = await prisma.resume.create({
      data: {
        userId: user1Id,
        originalFileName: "user1_resume.pdf",
        storedFileName: "user1_resume_123.pdf",
        fileExtension: ".pdf",
        fileSize: 10240,
        mimeType: "application/pdf",
        storagePath: "uploads/resumes/user1_resume.pdf",
        extractedText: "Experienced in TypeScript, Node.js, PostgreSQL, Docker, AWS, and Distributed Systems.",
        parsedData: {
          skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
          totalExperienceYears: 5,
        },
      },
    });
    user1ResumeId = r1.id;

    // Create User 1 Job Description
    const jd1 = await prisma.jobDescription.create({
      data: {
        userId: user1Id,
        title: "Senior Backend Engineer",
        company: "Stripe",
        rawText: "We need a Senior Backend Engineer with Node.js, PostgreSQL, Redis, and high-throughput payment processing experience.",
        structuredJson: {
          roleTitle: "Senior Backend Engineer",
          seniority: "SENIOR",
          experienceYears: { min: 5, max: 8 },
          mustHaveSkills: ["Node.js", "PostgreSQL", "Redis"],
          niceToHaveSkills: ["Docker", "Kubernetes", "Kafka"],
          responsibilities: ["Build distributed payment microservices"],
        },
        providerUsed: "mock",
      },
    });
    user1JdId = jd1.id;

    // Create User 1 Job Match
    const m1 = await prisma.jobMatch.create({
      data: {
        userId: user1Id,
        resumeId: user1ResumeId,
        jdId: user1JdId,
        matchScore: 82,
        scoreBreakdown: {
          mustHaveSkillsScore: 80,
          niceToHaveSkillsScore: 70,
          experienceScore: 100,
          domainScore: 80,
        },
        matchedSkills: ["Node.js", "PostgreSQL", "Docker"],
        missingSkills: [
          { skill: "Redis", importance: "HIGH", category: "Database" },
          { skill: "Kafka", importance: "MEDIUM", category: "Messaging" },
        ],
        analysisJson: {
          experienceMatch: "Strong alignment with 5 years experience",
          projectRelevance: "High overlap in backend microservices",
          strengths: ["Strong relational DB background"],
          weaknesses: ["Missing Kafka event streaming"],
          recommendations: ["Review distributed consensus and message brokers"],
        },
        providerUsed: "mock",
      },
    });
    user1MatchId = m1.id;

    // Create User 2
    const u2 = await prisma.user.create({
      data: {
        name: "Question Prep User 2",
        email: "user2.questions@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({ userId: u2.id, role: u2.role, tier: u2.tier });

    // Create User 2 Resume & JD
    const r2 = await prisma.resume.create({
      data: {
        userId: user2Id,
        originalFileName: "user2_resume.pdf",
        storedFileName: "user2_resume_456.pdf",
        fileExtension: ".pdf",
        fileSize: 4096,
        mimeType: "application/pdf",
        storagePath: "uploads/resumes/user2_resume.pdf",
        extractedText: "Junior frontend developer with React, HTML, and CSS experience.",
      },
    });
    user2ResumeId = r2.id;

    const jd2 = await prisma.jobDescription.create({
      data: {
        userId: user2Id,
        title: "Frontend Intern",
        company: "DesignCo",
        rawText: "Entry level frontend web development internship with HTML and CSS.",
        structuredJson: {
          roleTitle: "Frontend Intern",
          seniority: "ENTRY",
          experienceYears: { min: 0, max: 1 },
          mustHaveSkills: ["HTML", "CSS"],
          niceToHaveSkills: ["React"],
          responsibilities: ["Build landing pages"],
        },
        providerUsed: "mock",
      },
    });
    user2JdId = jd2.id;
  });

  describe("POST /api/v1/questions/generate", () => {
    it("1. generates a standalone question set with default options and HTTP 201", async () => {
      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          topicFocus: "Distributed Microservices & PostgreSQL",
          difficulty: "HARD",
          count: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const qSet = res.body.data.questionSet;
      expect(qSet).toBeDefined();
      expect(qSet.id).toBeDefined();
      expect(qSet.userId).toBe(user1Id);
      expect(qSet.topicFocus).toBe("Distributed Microservices & PostgreSQL");
      expect(qSet.difficulty).toBe("HARD");
      expect(qSet.totalCount).toBe(5);
      expect(qSet.questions.length).toBe(5);
      expect(qSet.providerUsed).toBeDefined();

      for (const q of qSet.questions) {
        expect(q.id).toBeDefined();
        expect(q.questionSetId).toBe(qSet.id);
        expect(q.difficulty).toBe("HARD");
        expect(q.questionText).toBeDefined();
        expect(q.interviewerIntent).toBeDefined();
        expect(q.keyEvaluationPoints.length).toBeGreaterThan(0);
      }
    });

    it("2. generates questions contextualized by owned resume, JD, and match gap analysis", async () => {
      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user1JdId,
          matchId: user1MatchId,
          count: 6,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const qSet = res.body.data.questionSet;
      expect(qSet.resumeId).toBe(user1ResumeId);
      expect(qSet.jdId).toBe(user1JdId);
      expect(qSet.matchId).toBe(user1MatchId);
      expect(qSet.totalCount).toBe(6);
      expect(qSet.questions.length).toBe(6);
    });

    it("3. aliased route POST /api/v1/question-sets behaves identically", async () => {
      const res = await request(app)
        .post("/api/v1/question-sets")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          topicFocus: "Algorithms and Concurrency",
          count: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.questionSet.totalCount).toBe(4);
    });

    it("4. returns HTTP 400 when validation rules fail (e.g. count out of bounds)", async () => {
      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          count: 25, // Max is 20
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("5. returns HTTP 404 when referenced resume, JD, or match does not exist", async () => {
      const nonExistentUuid = "a0000000-0000-4000-8000-000000000001";

      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: nonExistentUuid,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("6. enforces BOLA/IDOR: User 1 cannot generate questions using User 2's resume or JD (returns 404)", async () => {
      // User 1 attempts to use User 2's resume
      const res1 = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user2ResumeId,
        });
      expect(res1.status).toBe(404);

      // User 1 attempts to use User 2's JD
      const res2 = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          jdId: user2JdId,
        });
      expect(res2.status).toBe(404);
    });
  });

  describe("GET /api/v1/questions", () => {
    it("7. lists only the authenticated user's question sets", async () => {
      // Create set for User 1
      await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ topicFocus: "User 1 Set", count: 3 });

      // Create set for User 2
      await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ topicFocus: "User 2 Set", count: 3 });

      // User 1 lists
      const res1 = await request(app)
        .get("/api/v1/questions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.questionSets.length).toBe(1);
      expect(res1.body.data.questionSets[0].userId).toBe(user1Id);
      expect(res1.body.data.questionSets[0].topicFocus).toBe("User 1 Set");

      // User 2 lists
      const res2 = await request(app)
        .get("/api/v1/questions")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.questionSets.length).toBe(1);
      expect(res2.body.data.questionSets[0].userId).toBe(user2Id);
      expect(res2.body.data.questionSets[0].topicFocus).toBe("User 2 Set");
    });
  });

  describe("GET /api/v1/questions/:id", () => {
    it("8. retrieves a question set by ID with nested questions", async () => {
      const createRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ topicFocus: "Detailed Set Test", count: 4 });

      const setId = createRes.body.data.questionSet.id;

      const res = await request(app)
        .get(`/api/v1/questions/${setId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questionSet.id).toBe(setId);
      expect(res.body.data.questionSet.questions.length).toBe(4);
    });

    it("9. enforces BOLA/IDOR: User 2 cannot access User 1's question set (returns 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ topicFocus: "Private Prep", count: 3 });

      const setId = createRes.body.data.questionSet.id;

      const res = await request(app)
        .get(`/api/v1/questions/${setId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("10. returns HTTP 404 for non-existent question set ID", async () => {
      const nonExistentUuid = "a0000000-0000-4000-8000-000000000002";
      const res = await request(app)
        .get(`/api/v1/questions/${nonExistentUuid}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/questions/:id", () => {
    it("11. deletes question set and cascades to child questions; subsequent GET returns 404", async () => {
      const createRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ topicFocus: "Delete Target", count: 3 });

      const setId = createRes.body.data.questionSet.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/questions/${setId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.message).toContain("deleted");

      // Verify subsequent GET returns 404
      const getRes = await request(app)
        .get(`/api/v1/questions/${setId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(getRes.status).toBe(404);

      // Verify child questions are removed from database
      const questionsCount = await prisma.question.count({
        where: { questionSetId: setId },
      });
      expect(questionsCount).toBe(0);
    });

    it("12. enforces BOLA/IDOR: User 2 cannot delete User 1's question set (returns 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ topicFocus: "Protected User 1 Set", count: 3 });

      const setId = createRes.body.data.questionSet.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/questions/${setId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(404);

      // Verify set still exists in DB
      const exists = await prisma.questionSet.findUnique({
        where: { id: setId },
      });
      expect(exists).not.toBeNull();
    });
  });

  describe("Security & Offline Fallback", () => {
    it("13. returns HTTP 401 when Authorization header is missing", async () => {
      const resPost = await request(app).post("/api/v1/questions/generate").send({ count: 5 });
      expect(resPost.status).toBe(401);

      const resGet = await request(app).get("/api/v1/questions");
      expect(resGet.status).toBe(401);

      const resDelete = await request(app).delete("/api/v1/questions/a0000000-0000-4000-8000-000000000001");
      expect(resDelete.status).toBe(401);
    });

    it("14. uses deterministic offline fallback when AI Gateway throws an error", async () => {
      const completeSpy = vi.spyOn(aiGateway, "completeStructured").mockRejectedValueOnce(new Error("AI Gateway Offline / Connection Refused"));

      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          topicFocus: "Offline Fallback Check",
          count: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const qSet = res.body.data.questionSet;
      expect(qSet.providerUsed.toUpperCase()).toBe("FALLBACK");
      expect(qSet.totalCount).toBe(5);
      expect(qSet.questions.length).toBe(5);

      completeSpy.mockRestore();
    });
  });
});
