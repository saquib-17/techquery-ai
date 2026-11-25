import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import path from "node:path";
import { createApp } from "../../src/app.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { config } from "../../src/core/config/index.js";

describe("V1 Backend Release Gate — Complete End-to-End Candidate Journey", () => {
  const app = createApp();
  const validPdfPath = path.resolve("./node_modules/pdf-parse/test/data/01-valid.pdf");

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();
  });

  it(
    "executes the complete unified candidate lifecycle from registration through PDF export, dashboard streaks, Pro upgrade, refresh, and logout",
    async () => {
      // 1. Register -> Verify Email -> Login
      const email = "e2e.candidate@example.com";
      const password = "StrongPassword123!";

      const regRes = await request(app).post("/api/v1/auth/register").send({
        name: "E2E Candidate",
        email,
        password,
      });
      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      const verificationToken = new URL(regRes.body.data.verificationUrl).searchParams.get("token")!;
      expect(verificationToken).toBeTruthy();

      const verifyRes = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: verificationToken });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.user.isVerified).toBe(true);

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email,
        password,
      });
      expect(loginRes.status).toBe(200);
      const accessToken: string = loginRes.body.data.accessToken;
      expect(accessToken).toBeTruthy();

      const setCookies = loginRes.headers["set-cookie"];
      expect(setCookies).toBeDefined();
      const rawCookieHeader = Array.isArray(setCookies) ? setCookies[0] : setCookies;
      const refreshCookie = rawCookieHeader.split(";")[0];
      expect(refreshCookie).toContain("refreshToken=");

      // 2. Create Candidate Profile & Complete Onboarding
      const profileRes = await request(app)
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          fullName: "E2E Candidate",
          currentRole: "Backend Engineer",
          yearsOfExperience: 3,
          highestEducation: "MCA",
          headline: "Distributed Systems & TypeScript Engineer",
        });
      expect(profileRes.status).toBe(201);
      expect(profileRes.body.data.profile.fullName).toBe("E2E Candidate");

      const onboardRes = await request(app)
        .patch("/api/v1/onboarding")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          onboardingStep: "COMPLETED",
          markCompleted: true,
        });
      expect(onboardRes.status).toBe(200);
      expect(onboardRes.body.data.onboarding.onboardingCompleted).toBe(true);

      // 3. Upload PDF Resume -> Trigger AI Resume Intelligence
      const resumeRes = await request(app)
        .post("/api/v1/resumes")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("file", validPdfPath);
      expect(resumeRes.status).toBe(201);
      const resumeId: string = resumeRes.body.data.resume.id;

      const analyzeRes = await request(app)
        .post(`/api/v1/resumes/${resumeId}/analyze`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send();
      expect(analyzeRes.status).toBe(200);
      const analysis = analyzeRes.body.data.analysis;
      expect(typeof analysis.atsScore).toBe("number");
      expect(analysis.sectionScores).toBeDefined();
      expect(analyzeRes.body.data.parsedData).toBeDefined();

      // 4. Submit Target Job Description
      const jdRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "Senior Backend Engineer",
          company: "Stripe",
          rawText:
            "We are hiring a Senior Backend Engineer proficient in TypeScript, Node.js, PostgreSQL, and distributed systems to design resilient payment APIs and scalable microservices.",
        });
      expect(jdRes.status).toBe(201);
      const jd = jdRes.body.data.jobDescription;
      const jdId: string = jd.id;
      expect(jd.structuredJson).toBeDefined();
      expect(jd.structuredJson.roleTitle).toBeTruthy();
      expect(jd.structuredJson.seniority).toBeTruthy();
      expect(Array.isArray(jd.structuredJson.mustHaveSkills)).toBe(true);
      expect(Array.isArray(jd.structuredJson.niceToHaveSkills)).toBe(true);

      // 5. Evaluate Resume-JD Match
      const matchRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ resumeId, jdId });
      expect([200, 201]).toContain(matchRes.status);
      const match = matchRes.body.data.match;
      const matchId: string = match.id;
      expect(typeof match.matchScore).toBe("number");
      expect(Array.isArray(match.matchedSkills)).toBe(true);
      expect(Array.isArray(match.missingSkills)).toBe(true);
      expect(match.analysisJson).toBeDefined();

      // 6. Generate Tailored Question Set (All 5 Categories)
      const qsRes = await request(app)
        .post("/api/v1/questions/generate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          resumeId,
          jdId,
          matchId,
          topicFocus: "Backend Architecture & Payments",
          difficulty: "HARD",
          categories: [
            "THEORETICAL",
            "CODING",
            "SYSTEM_DESIGN",
            "BEHAVIORAL",
            "PROJECT_DEFENSE",
          ],
          count: 5,
        });
      expect(qsRes.status).toBe(201);
      const questionSet = qsRes.body.data.questionSet;
      const questionSetId: string = questionSet.id;
      const questions: Array<{ id: string; category: string }> = questionSet.questions;
      expect(questions).toHaveLength(5);

      const categoriesReturned = questions.map((q) => q.category);
      expect(categoriesReturned).toContain("THEORETICAL");
      expect(categoriesReturned).toContain("CODING");
      expect(categoriesReturned).toContain("SYSTEM_DESIGN");
      expect(categoriesReturned).toContain("BEHAVIORAL");
      expect(categoriesReturned).toContain("PROJECT_DEFENSE");

      const codingQuestion = questions.find((q) => q.category === "CODING")!;
      const behavioralQuestion = questions.find((q) => q.category === "BEHAVIORAL")!;

      // 7. Generate Model Answers (Technical + Behavioral)
      const techAnsRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          questionId: codingQuestion.id,
          style: "DETAILED",
        });
      expect(techAnsRes.status).toBe(201);
      const techAnswer = techAnsRes.body.data.answer;
      expect(techAnswer.shortSummary).toBeTruthy();
      expect(techAnswer.detailedExplanation).toBeTruthy();
      expect(techAnswer.codeSnippet).toBeTruthy();
      expect(techAnswer.timeComplexity).toBeTruthy();

      const behAnsRes = await request(app)
        .post("/api/v1/answers/generate")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          questionId: behavioralQuestion.id,
          style: "INTERVIEW",
        });
      expect(behAnsRes.status).toBe(201);
      const behAnswer = behAnsRes.body.data.answer;
      expect(behAnswer.shortSummary).toBeTruthy();
      expect(behAnswer.detailedExplanation).toBeTruthy();
      expect(behAnswer.codeSnippet).toBeNull();
      expect(behAnswer.timeComplexity).toBeNull();
      expect(behAnswer.spaceComplexity).toBeNull();

      // 8. Create Saved Collection, Bookmark Questions, and Export Both PDFs
      const collRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          name: "Stripe Final Round Prep",
          description: "Bookmarked coding and behavioral questions",
        });
      expect(collRes.status).toBe(201);
      const collectionId: string = collRes.body.data.collection.id;

      const bookmark1 = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ questionId: codingQuestion.id });
      expect(bookmark1.status).toBe(201);

      const bookmark2 = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ questionId: behavioralQuestion.id });
      expect(bookmark2.status).toBe(201);

      const exportCollRes = await request(app)
        .get(`/api/v1/collections/${collectionId}/export/pdf`)
        .set("Authorization", `Bearer ${accessToken}`)
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => cb(null, Buffer.concat(chunks)));
        });
      expect(exportCollRes.status).toBe(200);
      expect(exportCollRes.headers["content-type"]).toContain("application/pdf");
      expect((exportCollRes.body as Buffer).subarray(0, 5).toString("ascii")).toBe("%PDF-");

      const exportQsRes = await request(app)
        .get(`/api/v1/question-sets/${questionSetId}/export/pdf`)
        .set("Authorization", `Bearer ${accessToken}`)
        .buffer(true)
        .parse((res, cb) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => cb(null, Buffer.concat(chunks)));
        });
      expect(exportQsRes.status).toBe(200);
      expect(exportQsRes.headers["content-type"]).toContain("application/pdf");
      expect((exportQsRes.body as Buffer).subarray(0, 5).toString("ascii")).toBe("%PDF-");

      // 9. Verify Dashboard Summary
      const summaryRes = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(summaryRes.status).toBe(200);
      const summary = summaryRes.body.data;
      expect(summary.metrics).toEqual({
        resumesCount: 1,
        jobDescriptionsCount: 1,
        jobMatchesCount: 1,
        averageMatchScore: match.matchScore,
        questionSetsCount: 1,
        questionsCount: 5,
        answersCount: 2,
        collectionsCount: 1,
        bookmarkedQuestionsCount: 2,
      });
      expect(summary.streak.currentStreak).toBeGreaterThanOrEqual(1);
      expect(summary.recentActivities.length).toBeGreaterThanOrEqual(8);

      // 10. Verify Quotas -> 1-Click Pro Upgrade -> Refresh Token -> Logout
      const quotasRes = await request(app)
        .get("/api/v1/usage/quotas")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(quotasRes.status).toBe(200);
      expect(quotasRes.body.data.tier).toBe("FREE");
      expect(quotasRes.body.data.quotas.resumes.used).toBe(1);

      const upgradeRes = await request(app)
        .patch("/api/v1/usage/tier")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ tier: "PRO" });
      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.data.tier).toBe("PRO");
      expect(upgradeRes.body.data.quotas.resumes.limit).toBe(10);
      expect(upgradeRes.body.data.quotas.answersMonthly.isUnlimited).toBe(true);

      const refreshRes = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Origin", config.FRONTEND_URL)
        .set("Cookie", [refreshCookie]);
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeTruthy();

      const newCookies = refreshRes.headers["set-cookie"];
      const rotatedCookie = (Array.isArray(newCookies) ? newCookies[0] : newCookies).split(";")[0];

      const logoutRes = await request(app)
        .post("/api/v1/auth/logout")
        .set("Origin", config.FRONTEND_URL)
        .set("Cookie", [rotatedCookie]);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    },
    30000
  );
});
