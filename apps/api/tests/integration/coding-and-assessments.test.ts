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
        expect(p.starterCode.java).toMatch(/\bclass\s+(Solution|MedianFinder|Trie|MyStack|MinStack)\b/);
        const sampleInputs = p.sampleTestCases.map((tc: { stdin: string }) => tc.stdin);
        expect(new Set(sampleInputs).size).toBe(sampleInputs.length);
      }
    });

    it("wraps class Solution with server-side driverCode in single-batch mode, auto-marks SOLVED on 20/20 submit, and masks in TIMED OA", async () => {
      const listRes = await request(app)
        .get("/api/v1/coding/problems?difficulty=EASY")
        .set("Authorization", `Bearer ${userToken}`);
      const twoSumProblem = listRes.body.data.problems.find(
        (p: { slug: string }) => p.slug === "two-sum"
      );
      const problemId = twoSumProblem.id as string;

      const spy = vi
        .spyOn(judge0Adapter, "executeBatch")
        .mockImplementation(async ({ testCases }) => ({
          verdict: "ACCEPTED",
          results: testCases.map((tc, idx) => ({
            testCaseId: tc.id,
            caseNumber: idx + 1,
            isHidden: !tc.isSample,
            passed: true,
            actualOutput: tc.expectedOutput,
            verdict: "ACCEPTED",
          })),
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
      expect(sampleRes.body.data.result.totalCount).toBe(3);
      expect(sampleRes.body.data.result.submissionId).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]?.[0].code).toContain('if __name__ == "__main__":');

      spy.mockClear();

      // Standalone SUBMIT runs all 20 cases in 1 batch, reveals hidden details, and marks DSA Sheet SOLVED
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
      expect(submitRes.body.data.result.totalCount).toBe(20);
      expect(submitRes.body.data.result.submissionId).toBeTruthy();
      expect(spy).toHaveBeenCalledTimes(1);

      const hiddenStandalone = submitRes.body.data.result.results.slice(3);
      expect(hiddenStandalone).toHaveLength(17);
      for (const hr of hiddenStandalone) {
        expect(hr.stdin).not.toBe("[Hidden]");
        expect(hr.expectedOutput).not.toBe("[Hidden]");
      }

      const dsaProgress = await prisma.userDsaSheetProgress.findUnique({
        where: { userId_problemSlug: { userId, problemSlug: "two-sum" } },
      });
      expect(dsaProgress?.status).toBe("SOLVED");
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

      // Partial OA submission (60% of test cases pass -> 60 pts)
      vi.spyOn(judge0Adapter, "executeBatch").mockImplementation(
        async ({ testCases }) => {
          const passLimit = Math.round(testCases.length * 0.6);
          const results = testCases.slice(0, passLimit + 1).map((tc, idx) => {
            const pass = idx < passLimit;
            return {
              testCaseId: tc.id,
              caseNumber: idx + 1,
              isHidden: !tc.isSample,
              passed: pass,
              actualOutput: pass ? tc.expectedOutput : "wrong",
              verdict: (pass ? "ACCEPTED" : "WRONG_ANSWER") as "ACCEPTED" | "WRONG_ANSWER",
            };
          });
          return {
            verdict: "WRONG_ANSWER",
            results,
            firstFailingCaseNumber: passLimit + 1,
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
      expect(submitRes.body.data.result.friendlyMessage).toContain("Wrong Answer on Test Case #");
      // TIMED OA masks hidden test case details
      const lastResult = submitRes.body.data.result.results[submitRes.body.data.result.results.length - 1];
      if (lastResult.isHidden) {
        expect(lastResult.stdin).toBe("[Hidden]");
        expect(lastResult.expectedOutput).toBe("[Hidden]");
      }

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

      // Other user cannot delete user1's session (404)
      const otherDelete = await request(app)
        .delete(`/api/v1/assessments/${untimed.id}`)
        .set("Authorization", `Bearer ${otherUserToken}`);
      expect(otherDelete.status).toBe(404);

      // Owner deletes single session
      const ownerDelete = await request(app)
        .delete(`/api/v1/assessments/${untimed.id}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(ownerDelete.status).toBe(200);
      expect(ownerDelete.body.data.deleted).toBe(true);

      // Clear remaining history (timedId was EXPIRED)
      const clearRes = await request(app)
        .delete("/api/v1/assessments")
        .set("Authorization", `Bearer ${userToken}`);
      expect(clearRes.status).toBe(200);
      expect(clearRes.body.data.deletedCount).toBe(1);

      const emptyHistory = await request(app)
        .get("/api/v1/assessments/history")
        .set("Authorization", `Bearer ${userToken}`);
      expect(emptyHistory.body.data.sessions).toHaveLength(0);
    });
    it("audits all 103 curated LeetCode problems (100 Wave 1+2+3 + 3 legacy) for unique slugs, class Solution, driverCode, and distinct test cases", async () => {
      expect(CURATED_CODING_PROBLEMS).toHaveLength(103);
      const slugs = new Set(CURATED_CODING_PROBLEMS.map((p) => p.slug));
      const titles = new Set(CURATED_CODING_PROBLEMS.map((p) => p.title));
      expect(slugs.size).toBe(103);
      expect(titles.size).toBe(103);

      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "EASY").length
      ).toBeGreaterThanOrEqual(25);
      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "MEDIUM").length
      ).toBeGreaterThanOrEqual(50);
      expect(
        CURATED_CODING_PROBLEMS.filter((p) => p.difficulty === "HARD").length
      ).toBeGreaterThanOrEqual(20);

      for (const p of CURATED_CODING_PROBLEMS) {
        expect(p.starterCode.java).toMatch(/\bclass\s+(Solution|MedianFinder|Trie|MyStack|MinStack)\b/);
        expect(p.starterCode.python).toMatch(/\bclass\s+(Solution|MedianFinder|Trie|MyStack|MinStack)\b/);
        expect(p.starterCode.cpp).toMatch(/\bclass\s+(Solution|MedianFinder|Trie|MyStack|MinStack)\b/);
        expect(p.starterCode.javascript).toMatch(/\bvar\s+\w+\s*=\s*function/);

        for (const lang of ["java", "python", "cpp", "javascript"] as const) {
          expect(p.driverCode[lang]).toContain("{{USER_CODE}}");
        }

        const allCases = [...p.sampleTestCases, ...p.hiddenTestCases];
        const expectedTotal = allCases.length;
        expect([5, 20]).toContain(expectedTotal);
        const inputs = allCases.map((tc) => tc.stdin);
        expect(new Set(inputs).size).toBe(expectedTotal);
        for (const tc of allCases) {
          expect(typeof tc.stdin).toBe("string");
          expect(typeof tc.expectedOutput).toBe("string");
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
