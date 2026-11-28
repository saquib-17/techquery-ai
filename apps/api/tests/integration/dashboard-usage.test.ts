import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import path from "node:path";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Dashboard, Preparation Streaks & Usage Quotas Integration Tests (Phase J)", () => {
  const app = createApp();
  const validPdfPath = path.resolve("./node_modules/pdf-parse/test/data/01-valid.pdf");

  let user1Id: string;
  let user1Token: string;

  let user2Id: string;
  let user2Token: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    // 1. Create User 1 (Default FREE tier)
    const u1 = await prisma.user.create({
      data: {
        name: "Dashboard User One",
        email: "user1.dashboard@example.com",
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

    // 2. Create User 2 (Isolated user)
    const u2 = await prisma.user.create({
      data: {
        name: "Dashboard User Two",
        email: "user2.dashboard@example.com",
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
  });

  describe("1. Candidate Dashboard Summary (`GET /api/v1/dashboard/summary`)", () => {
    it("returns zeroes, empty streak, and FREE tier for a fresh candidate account", async () => {
      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.metrics).toEqual({
        resumesCount: 0,
        jobDescriptionsCount: 0,
        jobMatchesCount: 0,
        averageMatchScore: null,
        questionSetsCount: 0,
        questionsCount: 0,
        answersCount: 0,
        collectionsCount: 0,
        bookmarkedQuestionsCount: 0,
      });

      expect(data.streak).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
        activityMatrix: [],
      });

      expect(data.recentActivities).toEqual([]);
      expect(data.usage.tier).toBe("FREE");
      expect(data.usage.quotas.resumes.used).toBe(0);
      expect(data.usage.quotas.resumes.limit).toBe(3);

      expect(data.dsaMastery.solvedCount).toBe(0);
      expect(data.dsaMastery.totalProblems).toBe(520);
      expect(data.dsaMastery.nextProblem?.slug).toBe("two-sum");

      expect(data.csAndHrMastery.learnedCount).toBe(0);
      expect(data.csAndHrMastery.totalTopics).toBe(210);
      expect(data.csAndHrMastery.nextTopic?.slug).toBe("os-01-what-is-an-os");

      expect(data.roadmapProgress.activeRoadmapId).toBeNull();
      expect(data.roadmapProgress.percentage).toBe(0);
      expect(data.completedOaSessions).toBe(0);
    });

    it("aggregates real DSA, CS/HR, and Roadmap progress into dashboard summary and streak", async () => {
      await request(app)
        .put("/api/v1/dsa-sheet/two-sum/progress")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ status: "SOLVED" });

      await request(app)
        .put("/api/v1/cs-fundamentals/os-01-what-is-an-os/progress")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ status: "LEARNED" });

      const rmRes = await request(app)
        .post("/api/v1/roadmaps/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          targetRole: "Backend Engineer",
          durationWeeks: 8,
          dailyHours: 2,
          currentLevel: "INTERMEDIATE",
        });
      expect(rmRes.status).toBe(201);
      const rm = rmRes.body.data.roadmap;
      const firstTaskId = rm.phases[0].tasks[0].id;

      await request(app)
        .patch(`/api/v1/roadmaps/${rm.id}/tasks`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ taskId: firstTaskId, completed: true });

      const summaryRes = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(summaryRes.status).toBe(200);
      const d = summaryRes.body.data;
      expect(d.dsaMastery.solvedCount).toBe(1);
      expect(d.dsaMastery.nextProblem?.slug).not.toBe("two-sum");
      expect(d.csAndHrMastery.learnedCount).toBe(1);
      expect(d.csAndHrMastery.nextTopic?.slug).not.toBe("os-01-what-is-an-os");
      expect(d.roadmapProgress.activeRoadmapId).toBe(rm.id);
      expect(d.roadmapProgress.completedTasks).toBe(1);
      expect(d.roadmapProgress.percentage).toBeGreaterThan(0);
      expect(d.streak.totalActiveDays).toBeGreaterThanOrEqual(1);
    });

    it(
      "aggregates real portfolio metrics, active streaks, and recent activities across end-to-end actions",
      async () => {
      // Step A: Upload a resume
      const resumeRes = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);
      expect(resumeRes.status).toBe(201);
      const resumeId = resumeRes.body.data.resume.id;

      // Step B: Create a job description
      const jdRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Staff Platform Engineer",
          company: "Cloudflare",
          rawText: "Looking for an expert in TypeScript, Node.js, and distributed systems architecture to design and build scalable, high-throughput microservices.",
        });
      expect(jdRes.status).toBe(201);
      const jdId = jdRes.body.data.jobDescription.id;

      // Step C: Run match analysis
      const matchRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId, jdId });
      expect([200, 201]).toContain(matchRes.status);

      // Step D: Generate question set
      const qsRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId,
          jdId,
          topicFocus: "Distributed Systems",
          difficulty: "HARD",
          categories: ["SYSTEM_DESIGN"],
          count: 3,
        });
      expect(qsRes.status).toBe(201);
      const questionSetId = qsRes.body.data.questionSet.id;
      const questionId = qsRes.body.data.questionSet.questions[0].id;

      // Step E: Generate model answer
      const answerRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          questionId,
          style: "DETAILED",
        });
      expect([200, 201]).toContain(answerRes.status);

      // Step F: Create saved collection
      const collRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Cloudflare Staff Prep",
          description: "Top questions for upcoming interview",
        });
      expect(collRes.status).toBe(201);
      const collectionId = collRes.body.data.collection.id;

      // Step G: Export collection PDF
      const exportCollRes = await request(app)
        .get(`/api/v1/collections/${collectionId}/export/pdf`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(exportCollRes.status).toBe(200);

      // Step H: Export question set PDF
      const exportQsRes = await request(app)
        .get(`/api/v1/question-sets/${questionSetId}/export/pdf`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(exportQsRes.status).toBe(200);

      // Step I: Fetch Dashboard Summary
      const summaryRes = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(summaryRes.status).toBe(200);
      const data = summaryRes.body.data;

      // Assert metrics reflect exact counts
      expect(data.metrics.resumesCount).toBe(1);
      expect(data.metrics.jobDescriptionsCount).toBe(1);
      expect(data.metrics.jobMatchesCount).toBe(1);
      expect(typeof data.metrics.averageMatchScore).toBe("number");
      expect(data.metrics.averageMatchScore).toBeGreaterThanOrEqual(0);
      expect(data.metrics.questionSetsCount).toBe(1);
      expect(data.metrics.questionsCount).toBe(3);
      expect(data.metrics.answersCount).toBe(1);
      expect(data.metrics.collectionsCount).toBe(1);

      // Assert streak reflects active practice today
      expect(data.streak.currentStreak).toBe(1);
      expect(data.streak.longestStreak).toBe(1);
      expect(data.streak.totalActiveDays).toBe(1);
      expect(data.streak.lastActiveDate).toBeTruthy();
      expect(data.streak.activityMatrix).toHaveLength(1);
      expect(data.streak.activityMatrix[0].count).toBeGreaterThanOrEqual(8);

      // Assert recent activities contains logged events
      expect(data.recentActivities.length).toBeGreaterThanOrEqual(8);
      const activityTypes = data.recentActivities.map((a: any) => a.activityType);
      expect(activityTypes).toContain("RESUME_UPLOADED");
      expect(activityTypes).toContain("JD_ANALYZED");
      expect(activityTypes).toContain("MATCH_EVALUATED");
      expect(activityTypes).toContain("QUESTIONS_GENERATED");
      expect(activityTypes).toContain("ANSWER_GENERATED");
      expect(activityTypes).toContain("COLLECTION_CREATED");
      expect(activityTypes).toContain("PDF_EXPORTED");
    }, 30000);
  });

  describe("2. Usage Quotas & Tier Management (`/api/v1/usage`)", () => {
    it("reports exact used, limit, and remaining quantities for FREE tier", async () => {
      // Upload 1 resume
      await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);

      const res = await request(app)
        .get("/api/v1/usage/quotas")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const quotas = res.body.data.quotas;
      expect(quotas.resumes).toEqual({
        used: 1,
        limit: 3,
        remaining: 2,
        isUnlimited: false,
      });

      expect(quotas.jobDescriptions).toEqual({
        used: 0,
        limit: 5,
        remaining: 5,
        isUnlimited: false,
      });

      expect(quotas.questionSetsMonthly).toEqual({
        used: 0,
        limit: 5,
        remaining: 5,
        isUnlimited: false,
      });

      expect(quotas.answersMonthly).toEqual({
        used: 0,
        limit: 20,
        remaining: 20,
        isUnlimited: false,
      });
    });

    it("enforces Free tier quota limit (3 resumes) with HTTP 429 QUOTA_EXCEEDED", async () => {
      // 1. Upload Resume 1 -> 201 Created
      const r1 = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);
      expect(r1.status).toBe(201);

      // 2. Upload Resume 2 -> 201 Created
      const r2 = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);
      expect(r2.status).toBe(201);

      // 3. Upload Resume 3 -> 201 Created (Quota limit reached: 3/3)
      const r3 = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);
      expect(r3.status).toBe(201);

      // 4. Attempt Upload Resume 4 -> 429 Too Many Requests (QUOTA_EXCEEDED)
      const r4 = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);

      expect(r4.status).toBe(429);
      expect(r4.body.success).toBe(false);
      expect(r4.body.error.code).toBe("QUOTA_EXCEEDED");
      expect(r4.body.error.message).toContain("maximum allowed resumes (3) for the FREE tier");
    });

    it(
      "simulates instant ₹0 1-click Pro tier upgrade and unblocks 4th resume upload",
      async () => {
      // Fill 3/3 Free resume quota
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/v1/resumes")
          .set("Authorization", `Bearer ${user1Token}`)
          .attach("file", validPdfPath);
      }

      // Upgrade to PRO
      const upgradeRes = await request(app)
        .patch("/api/v1/usage/tier")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ tier: "PRO" });

      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.success).toBe(true);
      expect(upgradeRes.body.data.tier).toBe("PRO");
      expect(upgradeRes.body.data.quotas.resumes.limit).toBe(10);
      expect(upgradeRes.body.data.quotas.resumes.remaining).toBe(7);
      expect(upgradeRes.body.data.quotas.answersMonthly.isUnlimited).toBe(true);

      // Uploading 4th resume now succeeds under PRO allowance
      const r4 = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);

      expect(r4.status).toBe(201);
      expect(r4.body.success).toBe(true);

      // Check dashboard reflects TIER_CHANGED activity
      const summaryRes = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${user1Token}`);

      const recentTypes = summaryRes.body.data.recentActivities.map((a: any) => a.activityType);
      expect(recentTypes).toContain("TIER_CHANGED");
    }, 30000);

    it("rejects invalid tier option with 400 Bad Request", async () => {
      const res = await request(app)
        .patch("/api/v1/usage/tier")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ tier: "ENTERPRISE" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("3. Tenant Isolation & Security", () => {
    it("ensures User 2 dashboard metrics and usage quotas remain completely isolated from User 1", async () => {
      // User 1 performs actions
      await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${user1Token}`)
        .attach("file", validPdfPath);

      await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "User 1 Secret Prep" });

      // User 2 inspects dashboard
      const u2Dashboard = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(u2Dashboard.status).toBe(200);
      expect(u2Dashboard.body.data.metrics.resumesCount).toBe(0);
      expect(u2Dashboard.body.data.metrics.collectionsCount).toBe(0);
      expect(u2Dashboard.body.data.recentActivities).toHaveLength(0);

      // User 2 inspects quotas
      const u2Quotas = await request(app)
        .get("/api/v1/usage/quotas")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(u2Quotas.status).toBe(200);
      expect(u2Quotas.body.data.quotas.resumes.used).toBe(0);
      expect(u2Quotas.body.data.quotas.resumes.remaining).toBe(3);
    });

    it("rejects unauthenticated requests to dashboard and usage endpoints with 401", async () => {
      const dRes = await request(app).get("/api/v1/dashboard/summary");
      expect(dRes.status).toBe(401);

      const qRes = await request(app).get("/api/v1/usage/quotas");
      expect(qRes.status).toBe(401);

      const tRes = await request(app).patch("/api/v1/usage/tier").send({ tier: "PRO" });
      expect(tRes.status).toBe(401);
    });
  });
});
