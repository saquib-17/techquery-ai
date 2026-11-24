import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { aiGateway } from "../../src/core/ai/ai.gateway.js";

describe("Resume-Job Matching API Integration Tests", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user1ResumeId: string;
  let user1JdId: string;

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
        name: "Alice Developer",
        email: "alice.matcher@example.com",
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
        originalFileName: "alice_resume.pdf",
        storedFileName: "alice_resume_123.pdf",
        fileExtension: ".pdf",
        fileSize: 10240,
        mimeType: "application/pdf",
        storagePath: "uploads/resumes/alice_resume.pdf",
        extractedText: `
          Alice Developer
          Senior Software Engineer with 6 years of experience.
          Skills: TypeScript, Node.js, PostgreSQL, Docker, AWS, React, Redis, GraphQL, Git.
          Experience:
          Senior Backend Developer at CloudCorp (2020 - Present) - 4 years.
          Designed high-throughput microservices using Node.js, Express, and PostgreSQL.
          Managed container deployments using Docker and AWS ECS.
          Full Stack Engineer at StartUpX (2018 - 2020) - 2 years.
          Built RESTful web APIs and React single page applications.
          Education:
          B.S. in Computer Science (2014 - 2018).
        `,
        parsedData: {
          skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS", "React", "Redis"],
          totalExperienceYears: 6,
          workExperience: [
            {
              title: "Senior Backend Developer",
              company: "CloudCorp",
              duration: "4 years",
              responsibilities: ["Built microservices", "Container deployments"],
            },
            {
              title: "Full Stack Engineer",
              company: "StartUpX",
              duration: "2 years",
              responsibilities: ["REST APIs", "React SPAs"],
            },
          ],
        },
      },
    });
    user1ResumeId = r1.id;

    // Optional structured resume analysis for User 1
    await prisma.resumeAnalysis.create({
      data: {
        resumeId: user1ResumeId,
        atsScore: 90,
        sectionScores: {
          contactInfo: 100,
          summary: 85,
          workExperience: 90,
          education: 85,
          skills: 90,
          formatting: 88,
        },
        strengths: ["Strong backend depth", "Clear quantifiable metrics"],
        issues: [],
        improvements: ["Add system architecture diagrams"],
        providerUsed: "mock",
      },
    });

    // Create User 1 Job Description
    const jd1 = await prisma.jobDescription.create({
      data: {
        userId: user1Id,
        title: "Senior Backend Engineer",
        company: "TechScale Inc.",
        rawText: `
          We are looking for a Senior Backend Engineer with at least 5 years of experience.
          Must have: Node.js, TypeScript, PostgreSQL, Docker.
          Nice to have: Kubernetes, Redis, AWS.
          Responsibilities: Build resilient distributed backend APIs.
        `,
        structuredJson: {
          roleTitle: "Senior Backend Engineer",
          seniority: "SENIOR",
          experienceYears: { min: 5, max: 8 },
          mustHaveSkills: ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
          niceToHaveSkills: ["Kubernetes", "Redis", "AWS"],
          techStackCategories: {
            languages: ["TypeScript", "JavaScript"],
            frameworks: ["Node.js", "Express"],
            databases: ["PostgreSQL", "Redis"],
            cloudAndDevops: ["Docker", "Kubernetes", "AWS"],
          },
          responsibilities: ["Architect scalable APIs", "Optimize queries"],
          keyRequirements: ["5+ years backend experience"],
        },
        providerUsed: "mock",
      },
    });
    user1JdId = jd1.id;

    // Create User 2
    const u2 = await prisma.user.create({
      data: {
        name: "Bob Junior",
        email: "bob.junior@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({ userId: u2.id, role: u2.role, tier: u2.tier });

    // Create User 2 Resume
    const r2 = await prisma.resume.create({
      data: {
        userId: user2Id,
        originalFileName: "bob_resume.pdf",
        storedFileName: "bob_resume_456.pdf",
        fileExtension: ".pdf",
        fileSize: 5120,
        mimeType: "application/pdf",
        storagePath: "uploads/resumes/bob_resume.pdf",
        extractedText: `Bob Junior. Junior developer with 1 year experience in HTML, CSS, JavaScript.`,
      },
    });
    user2ResumeId = r2.id;

    // Create User 2 Job Description
    const jd2 = await prisma.jobDescription.create({
      data: {
        userId: user2Id,
        title: "Frontend Intern",
        company: "DesignCo",
        rawText: `Internship position requiring basic HTML and CSS knowledge. 0 to 1 year experience.`,
        structuredJson: {
          roleTitle: "Frontend Intern",
          seniority: "ENTRY",
          experienceYears: { min: 0, max: 1 },
          mustHaveSkills: ["HTML", "CSS"],
          niceToHaveSkills: ["JavaScript"],
          techStackCategories: {
            languages: ["HTML", "CSS", "JavaScript"],
            frameworks: [],
            databases: [],
            cloudAndDevops: [],
          },
          responsibilities: ["Build landing pages"],
          keyRequirements: ["Basic HTML/CSS understanding"],
        },
        providerUsed: "mock",
      },
    });
    user2JdId = jd2.id;
  });

  describe("POST /api/v1/matches", () => {
    it("1. successfully evaluates and stores match report with HTTP 201", async () => {
      const res = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user1JdId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const match = res.body.data.match;
      expect(match).toBeDefined();
      expect(match.id).toBeDefined();
      expect(match.userId).toBe(user1Id);
      expect(match.resumeId).toBe(user1ResumeId);
      expect(match.jdId).toBe(user1JdId);

      // Score evaluation assertions
      expect(match.matchScore).toBeGreaterThanOrEqual(0);
      expect(match.matchScore).toBeLessThanOrEqual(100);

      // Breakdown assertions
      const breakdown = match.scoreBreakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown.mustHaveSkillsScore).toBe(100); // 4/4 matched = 100%
      expect(breakdown.niceToHaveSkillsScore).toBeGreaterThan(0); // AWS & Redis matched
      expect(breakdown.experienceScore).toBe(100); // 6 yrs >= 5 yrs required = 100%
      expect(breakdown.domainScore).toBeGreaterThanOrEqual(0);

      // Skills assertions
      expect(match.matchedSkills).toContain("Node.js");
      expect(match.matchedSkills).toContain("TypeScript");
      expect(match.matchedSkills).toContain("PostgreSQL");
      expect(match.matchedSkills).toContain("Docker");

      // Missing skills (Kubernetes was nice-to-have, not in resume)
      expect(match.missingSkills.some((s: { skill: string }) => s.skill.toLowerCase().includes("kubernetes"))).toBe(true);

      // Qualitative analysis assertions
      const analysis = match.analysisJson;
      expect(analysis).toBeDefined();
      expect(analysis.strengths.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.experienceMatch).toBeDefined();
      expect(analysis.projectRelevance).toBeDefined();

      // Provider
      expect(match.providerUsed).toBeDefined();
    });

    it("2. re-evaluating the same resume and jd upserts cleanly without duplicate key error", async () => {
      // First evaluation
      const res1 = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user1JdId,
        });
      expect(res1.status).toBe(201);
      const firstId = res1.body.data.match.id;

      // Second evaluation
      const res2 = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user1JdId,
        });
      expect(res2.status).toBe(201);
      const secondId = res2.body.data.match.id;

      // The record ID is preserved or updated
      expect(secondId).toBe(firstId);

      // Verify in DB only 1 match exists for user1
      const count = await prisma.jobMatch.count({
        where: { userId: user1Id },
      });
      expect(count).toBe(1);
    });

    it("3. returns HTTP 400 when resumeId or jdId is missing or invalid format", async () => {
      const resMissing = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.success).toBe(false);

      const resInvalid = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: "not-a-valid-id",
          jdId: "also-not-valid",
        });
      expect(resInvalid.status).toBe(400);
    });

    it("4. returns HTTP 404 when resume or job description does not exist", async () => {
      const nonExistentId = "a0000000-0000-4000-8000-000000000001";
      const res = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: nonExistentId,
          jdId: user1JdId,
        });
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("5. enforces BOLA/IDOR: User 1 cannot match against User 2's resume or JD (returns 404)", async () => {
      // User 1 tries to use User 2's resume
      const res1 = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user2ResumeId,
          jdId: user1JdId,
        });
      expect(res1.status).toBe(404);

      // User 1 tries to use User 2's JD
      const res2 = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user2JdId,
        });
      expect(res2.status).toBe(404);
    });

    it("6. succeeds when resume has no prior structured analysis (extracts from raw text)", async () => {
      // Create a resume without ResumeAnalysis record
      const rawResume = await prisma.resume.create({
        data: {
          userId: user1Id,
          originalFileName: "raw_resume.txt",
          storedFileName: "raw_resume_789.txt",
          fileExtension: ".txt",
          fileSize: 2048,
          mimeType: "text/plain",
          storagePath: "uploads/resumes/raw_resume.txt",
          extractedText: "Proficient in Node.js, TypeScript, PostgreSQL, and Docker. 5 years of software experience.",
        },
      });

      const res = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: rawResume.id,
          jdId: user1JdId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.match.matchScore).toBeGreaterThan(0);
      expect(res.body.data.match.matchedSkills).toContain("Node.js");
      expect(res.body.data.match.matchedSkills).toContain("TypeScript");
    });
  });

  describe("GET /api/v1/matches", () => {
    it("7. lists only the authenticated user's matches with resume and JD summaries", async () => {
      // Create match for User 1
      await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId: user1ResumeId, jdId: user1JdId });

      // Create match for User 2
      await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ resumeId: user2ResumeId, jdId: user2JdId });

      // User 1 lists matches
      const res1 = await request(app)
        .get("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.matches.length).toBe(1);
      expect(res1.body.data.matches[0].userId).toBe(user1Id);
      expect(res1.body.data.matches[0].resume).toBeDefined();
      expect(res1.body.data.matches[0].resume.originalFileName).toBe("alice_resume.pdf");
      expect(res1.body.data.matches[0].jobDescription).toBeDefined();
      expect(res1.body.data.matches[0].jobDescription.title).toBe("Senior Backend Engineer");

      // User 2 lists matches
      const res2 = await request(app)
        .get("/api/v1/matches")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.matches.length).toBe(1);
      expect(res2.body.data.matches[0].userId).toBe(user2Id);
    });
  });

  describe("GET /api/v1/matches/:id", () => {
    it("8. retrieves a specific match report by ID with HTTP 200", async () => {
      const createRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId: user1ResumeId, jdId: user1JdId });

      const matchId = createRes.body.data.match.id;

      const res = await request(app)
        .get(`/api/v1/matches/${matchId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.match.id).toBe(matchId);
      expect(res.body.data.match.matchScore).toBeDefined();
      expect(res.body.data.match.scoreBreakdown).toBeDefined();
      expect(res.body.data.match.matchedSkills).toBeDefined();
      expect(res.body.data.match.missingSkills).toBeDefined();
      expect(res.body.data.match.analysisJson).toBeDefined();
      expect(res.body.data.match.resume.originalFileName).toBe("alice_resume.pdf");
      expect(res.body.data.match.jobDescription.title).toBe("Senior Backend Engineer");
    });

    it("9. enforces BOLA/IDOR: User 2 cannot access User 1's match report (returns HTTP 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId: user1ResumeId, jdId: user1JdId });

      const matchId = createRes.body.data.match.id;

      const res = await request(app)
        .get(`/api/v1/matches/${matchId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("10. returns HTTP 404 when match report does not exist", async () => {
      const nonExistentId = "a0000000-0000-4000-8000-000000000002";
      const res = await request(app)
        .get(`/api/v1/matches/${nonExistentId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/matches/:id", () => {
    it("11. deletes match report with HTTP 200; subsequent GET returns 404", async () => {
      const createRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId: user1ResumeId, jdId: user1JdId });

      const matchId = createRes.body.data.match.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/matches/${matchId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.message).toContain("deleted");

      // Verify subsequent GET returns 404
      const getRes = await request(app)
        .get(`/api/v1/matches/${matchId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(404);
    });

    it("12. enforces BOLA/IDOR: User 2 cannot delete User 1's match report (returns HTTP 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ resumeId: user1ResumeId, jdId: user1JdId });

      const matchId = createRes.body.data.match.id;

      const deleteRes = await request(app)
        .delete(`/api/v1/matches/${matchId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body.success).toBe(false);

      // Verify the match still exists in DB
      const exists = await prisma.jobMatch.findUnique({
        where: { id: matchId },
      });
      expect(exists).not.toBeNull();
    });
  });

  describe("Security & Edge Cases", () => {
    it("13. returns HTTP 401 when Authorization header is missing", async () => {
      const resPost = await request(app).post("/api/v1/matches").send({
        resumeId: user1ResumeId,
        jdId: user1JdId,
      });
      expect(resPost.status).toBe(401);

      const resGet = await request(app).get("/api/v1/matches");
      expect(resGet.status).toBe(401);

      const resDelete = await request(app).delete(`/api/v1/matches/${user1ResumeId}`);
      expect(resDelete.status).toBe(401);
    });

    it("14. uses deterministic fallback qualitative analysis when AI Gateway throws an error", async () => {
      // Mock aiGateway.completeStructured to throw
      const completeSpy = vi.spyOn(aiGateway, "completeStructured").mockRejectedValueOnce(new Error("AI Gateway Offline / Timeout"));

      const res = await request(app)
        .post("/api/v1/matches")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          resumeId: user1ResumeId,
          jdId: user1JdId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const match = res.body.data.match;
      expect(match.providerUsed.toUpperCase()).toBe("FALLBACK");
      expect(match.analysisJson.experienceMatch).toBeDefined();
      expect(match.analysisJson.strengths.length).toBeGreaterThan(0);
      expect(match.analysisJson.recommendations.length).toBeGreaterThan(0);

      completeSpy.mockRestore();
    });
  });
});
