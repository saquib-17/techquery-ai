import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { judge0Adapter } from "../../src/modules/coding/judge0.adapter.js";
import { CURATED_CODING_PROBLEMS } from "../../src/modules/coding/curatedProblems.js";

describe("V2 Coding Arena, DSA Generation & Refresh-Safe Assessment API Integration Tests", () => {
  const app = createApp();

  let userToken: string;
  let userId: string;
  let otherUserToken: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    await assertTestDatabase();
    await cleanTestDatabase();

    const u1 = await prisma.user.create({
      data: {
        name: "Arena Candidate",
        email: "arena.candidate@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    userId = u1.id;
    userToken = JwtService.signAccessToken({
      userId: u1.id,
      role: u1.role,
      tier: u1.tier,
    });

    const u2 = await prisma.user.create({
      data: {
        name: "Other Candidate",
        email: "other.candidate@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    otherUserToken = JwtService.signAccessToken({
      userId: u2.id,
      role: u2.role,
      tier: u2.tier,
    });
  });

  describe("1. DSA_ALGORITHMS Question Generation Mode", () => {
    it("generates DSA questions and persists linked CodingProblem records", async () => {
      const res = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          generationMode: "DSA_ALGORITHMS",
          dsaPattern: "SLIDING_WINDOW",
          preferredLanguage: "python",
          difficulty: "MEDIUM",
          count: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const questionSet = res.body.data.questionSet;
      expect(questionSet.questions).toHaveLength(3);

      for (const q of questionSet.questions) {
        expect(q.category).toBe("CODING");
        expect(q.codingProblemId).toBeTruthy();

        const cp = await prisma.codingProblem.findUnique({
          where: { id: q.codingProblemId },
        });
        expect(cp).not.toBeNull();
        expect(cp?.userId).toBe(userId);
      }
    });
  });

  describe("2. Coding Arena Problem Bank & Judge0 Runner", () => {
    it("seeds curated problems, filters by difficulty/pattern, and never leaks hiddenTestCases", async () => {
      const res = await request(app)
        .get("/api/v1/coding/problems?difficulty=EASY")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const problems = res.body.data.problems;
      expect(problems.length).toBeGreaterThanOrEqual(3);

      for (const p of problems) {
        expect(p.difficulty).toBe("EASY");
        expect(p.sampleTestCases.length).toBeGreaterThanOrEqual(2);
        expect(p.hiddenTestCaseCount).toBeGreaterThanOrEqual(3);
        expect(p.hiddenTestCases).toBeUndefined();
        expect(p.driverCode).toBeUndefined();
        expect(p.starterCode.java).toContain("class Solution");
        const sampleInputs = p.sampleTestCases.map((tc: { stdin: string }) => tc.stdin);
        expect(new Set(sampleInputs).size).toBe(sampleInputs.length);
      }
    });

    it("wraps class Solution with server-side driverCode, reveals hidden tests in standalone mode, and masks in TIMED OA", async () => {
      const listRes = await request(app)
        .get("/api/v1/coding/problems?difficulty=EASY")
        .set("Authorization", `Bearer ${userToken}`);
      const problemId = listRes.body.data.problems[0].id as string;

      const spy = vi
        .spyOn(judge0Adapter, "executeTestCase")
        .mockImplementation(async ({ expectedOutput }) => ({
          verdict: "ACCEPTED",
          passed: true,
          actualOutput: expectedOutput,
          runtimeMs: 18,
          memoryKb: 1024,
        }));

      const sampleRes = await request(app)
        .post("/api/v1/coding/run")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          problemId,
          language: "python",
          code: "class Solution:\n  def twoSum(self, nums, target): return [0, 1]",
          mode: "SAMPLE",
        });

      expect(sampleRes.status).toBe(200);
      expect(sampleRes.body.data.result.verdict).toBe("ACCEPTED");
      expect(sampleRes.body.data.result.totalCount).toBe(2);
      expect(sampleRes.body.data.result.submissionId).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0]?.[0].code).toContain('if __name__ == "__main__":');

      spy.mockClear();

      // Standalone SUBMIT reveals hidden test case details for learning
      const submitRes = await request(app)
        .post("/api/v1/coding/run")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          problemId,
          language: "python",
          code: "class Solution:\n  def twoSum(self, nums, target): return [0, 1]",
          mode: "SUBMIT",
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.result.verdict).toBe("ACCEPTED");
      expect(submitRes.body.data.result.totalCount).toBe(5);
      expect(submitRes.body.data.result.submissionId).toBeTruthy();

      const hiddenStandalone = submitRes.body.data.result.results.slice(2);
      for (const hr of hiddenStandalone) {
        expect(hr.stdin).not.toBe("[Hidden]");
        expect(hr.expectedOutput).not.toBe("[Hidden]");
      }
    });
  });

  describe("3. Refresh-Safe Assessment & Practice Sessions", () => {
    it("supports TIMED session creation, 409 duplicate guard, draft autosave, partial OA scoring, and finish", async () => {
      const startRes = await request(app)
        .post("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          mode: "TIMED",
          difficultyPreset: "EASY_TO_MEDIUM",
          problemCount: 3,
          durationMinutes: 60,
        });

      expect(startRes.status).toBe(201);
      const session = startRes.body.data.session;
      expect(session.mode).toBe("TIMED");
      expect(session.status).toBe("IN_PROGRESS");
      expect(session.durationMinutes).toBe(60);
      expect(session.remainingSeconds).toBeGreaterThan(3500);
      expect(session.problems).toHaveLength(3);
      expect(session.problems[0].problem.difficulty).toBe("EASY");
      expect(session.problems[1].problem.difficulty).toBe("MEDIUM");

      // Duplicate active session guard
      const dupRes = await request(app)
        .post("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ mode: "UNTIMED", difficultyPreset: "EASY_ONLY", problemCount: 1 });
      expect(dupRes.status).toBe(409);

      // Save draft
      const firstProblemId = session.problems[0].problem.id as string;
      const draftRes = await request(app)
        .put(`/api/v1/assessments/${session.id}/draft`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          problemId: firstProblemId,
          language: "java",
          code: "public class Main { public static void main(String[] a) {} }",
        });
      expect(draftRes.status).toBe(200);
      expect(draftRes.body.data.session.drafts[firstProblemId].language).toBe("java");

      // Simulated browser reload: GET /active restores session + draft
      const activeRes = await request(app)
        .get("/api/v1/assessments/active")
        .set("Authorization", `Bearer ${userToken}`);
      expect(activeRes.status).toBe(200);
      expect(activeRes.body.data.session.id).toBe(session.id);
      expect(activeRes.body.data.session.drafts[firstProblemId].code).toContain(
        "public class Main"
      );

      // Partial OA submission (3 of 5 test cases pass -> 60 pts)
      let callCount = 0;
      vi.spyOn(judge0Adapter, "executeTestCase").mockImplementation(
        async ({ expectedOutput }) => {
          callCount += 1;
          const pass = callCount <= 3;
          return {
            verdict: pass ? "ACCEPTED" : "WRONG_ANSWER",
            passed: pass,
            actualOutput: pass ? expectedOutput : "wrong",
            runtimeMs: 12,
            memoryKb: 512,
          };
        }
      );

      const submitRes = await request(app)
        .post("/api/v1/coding/run")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          problemId: firstProblemId,
          language: "java",
          code: "public class Main {}",
          mode: "SUBMIT",
          assessmentSessionId: session.id,
        });
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.result.verdict).toBe("WRONG_ANSWER");
      expect(submitRes.body.data.result.passedCount).toBe(3);
      // TIMED OA masks hidden test case details
      expect(submitRes.body.data.result.results[2].stdin).toBe("[Hidden]");
      expect(submitRes.body.data.result.results[2].expectedOutput).toBe("[Hidden]");

      const refreshed = await request(app)
        .get(`/api/v1/assessments/${session.id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(refreshed.body.data.session.totalScore).toBe(60);
      expect(refreshed.body.data.session.problems[0].earnedPoints).toBe(60);
      expect(refreshed.body.data.session.problems[0].solved).toBe(false);

      // Finish session
      const finishRes = await request(app)
        .post(`/api/v1/assessments/${session.id}/finish`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(finishRes.status).toBe(200);
      expect(finishRes.body.data.session.status).toBe("COMPLETED");
    });

    it("auto-expires TIMED sessions when expiresAt is in the past and supports UNTIMED sessions + cancel", async () => {
      const startRes = await request(app)
        .post("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          mode: "TIMED",
          difficultyPreset: "EASY_ONLY",
          problemCount: 1,
          durationMinutes: 30,
        });
      const timedId = startRes.body.data.session.id as string;

      // Force expiresAt into the past
      await prisma.assessmentSession.update({
        where: { id: timedId },
        data: { expiresAt: new Date(Date.now() - 5000) },
      });

      const activeAfterExpiry = await request(app)
        .get("/api/v1/assessments/active")
        .set("Authorization", `Bearer ${userToken}`);
      expect(activeAfterExpiry.status).toBe(200);
      expect(activeAfterExpiry.body.data.session).toBeNull();

      const historyRes = await request(app)
        .get("/api/v1/assessments/history")
        .set("Authorization", `Bearer ${userToken}`);
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.sessions[0].id).toBe(timedId);
      expect(historyRes.body.data.sessions[0].status).toBe("EXPIRED");

      // Start UNTIMED session
      const untimedRes = await request(app)
        .post("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          mode: "UNTIMED",
          difficultyPreset: "SINGLE_FOCUS",
          singleDifficulty: "EASY",
          problemCount: 2,
        });
      expect(untimedRes.status).toBe(201);
      const untimed = untimedRes.body.data.session;
      expect(untimed.mode).toBe("UNTIMED");
      expect(untimed.durationMinutes).toBeNull();
      expect(untimed.expiresAt).toBeNull();
      expect(untimed.remainingSeconds).toBeNull();

      // BOLA/IDOR check: other user cannot access or cancel
      const otherGet = await request(app)
        .get(`/api/v1/assessments/${untimed.id}`)
        .set("Authorization", `Bearer ${otherUserToken}`);
      expect(otherGet.status).toBe(404);

      // Cancel untimed session
      const cancelRes = await request(app)
        .post(`/api/v1/assessments/${untimed.id}/cancel`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.session.status).toBe("CANCELLED");
    });
    it("audits all 12 curated LeetCode problems for unique slugs, class Solution, driverCode, and 5 distinct test cases", async () => {
      expect(CURATED_CODING_PROBLEMS).toHaveLength(12);
      const slugs = new Set(CURATED_CODING_PROBLEMS.map((p) => p.slug));
      const titles = new Set(CURATED_CODING_PROBLEMS.map((p) => p.title));
      expect(slugs.size).toBe(12);
      expect(titles.size).toBe(12);

      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "EASY")
      ).toHaveLength(4);
      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "MEDIUM")
      ).toHaveLength(4);
      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "HARD")
      ).toHaveLength(4);

      for (const p of CURATED_CODING_PROBLEMS) {
        expect(p.starterCode.java).toContain("class Solution");
        expect(p.starterCode.python).toContain("class Solution");
        expect(p.starterCode.cpp).toContain("class Solution");
        expect(p.starterCode.javascript).toMatch(/\bvar\s+\w+\s*=\s*function/);

        for (const lang of ["java", "python", "cpp", "javascript"] as const) {
          expect(p.driverCode[lang]).toContain("{{USER_CODE}}");
        }

        expect(p.sampleTestCases).toHaveLength(2);
        expect(p.hiddenTestCases).toHaveLength(3);
        const allCases = [...p.sampleTestCases, ...p.hiddenTestCases];
        const inputs = allCases.map((tc) => tc.stdin);
        expect(new Set(inputs).size).toBe(5);
        for (const tc of allCases) {
          expect(tc.stdin.trim().length).toBeGreaterThan(0);
          expect(tc.expectedOutput.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it("starts EASY_ONLY 3-problem session with 3 completely distinct Easy problems and zero Variant duplicates", async () => {
      const res = await request(app)
        .post("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          mode: "UNTIMED",
          difficultyPreset: "EASY_ONLY",
          problemCount: 3,
        });

      expect(res.status).toBe(201);
      const problems = res.body.data.session.problems;
      expect(problems).toHaveLength(3);
      const titles = problems.map((slot: { problem: { title: string } }) => slot.problem.title);
      expect(new Set(titles).size).toBe(3);
      for (const slot of problems) {
        expect(slot.problem.difficulty).toBe("EASY");
        expect(slot.problem.title).not.toContain("(Variant");
        expect(slot.problem.title).not.toContain("(Practice");
      }
    });
  });
});
