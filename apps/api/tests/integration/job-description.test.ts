import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Job Description Intelligence API Integration Tests", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  const validJdText = `
    Job Title: Senior Backend Engineer
    Location: Remote / Bangalore
    About the Role:
    We are seeking an experienced Senior Backend Engineer to architect, develop, and scale our core SaaS platform.
    Requirements:
    - 5+ years of software engineering experience building scalable backend microservices.
    - Deep expertise in Node.js, TypeScript, and relational databases like PostgreSQL.
    - Solid knowledge of caching systems (Redis) and message brokers (Kafka/RabbitMQ).
    - Production experience with Docker, AWS cloud infrastructure, and CI/CD automation.
    - Strong understanding of RESTful API design principles and database indexing.
    Responsibilities:
    - Design and implement resilient, distributed REST microservices.
    - Optimize database performance and implement query indexing best practices.
    - Collaborate closely with product managers and frontend developers to ship high-impact features.
  `;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const u1 = await prisma.user.create({
      data: {
        name: "JD Candidate One",
        email: "jd.user1@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({ userId: u1.id, role: u1.role, tier: u1.tier });

    const u2 = await prisma.user.create({
      data: {
        name: "JD Candidate Two",
        email: "jd.user2@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({ userId: u2.id, role: u2.role, tier: u2.tier });
  });

  describe("POST /api/v1/job-descriptions", () => {
    it("1. creates and decomposes a valid job description with HTTP 201", async () => {
      const res = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Senior Backend Engineer",
          company: "TechQuery Innovations",
          rawText: validJdText,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const jd = res.body.data.jobDescription;
      expect(jd).toBeDefined();
      expect(jd.id).toBeDefined();
      expect(jd.userId).toBe(user1Id);
      expect(jd.title).toBe("Senior Backend Engineer");
      expect(jd.company).toBe("TechQuery Innovations");
      expect(jd.rawText).toBe(validJdText.trim());
      expect(jd.providerUsed).toBeDefined();

      // Verify structured JSON breakdown
      const structured = jd.structuredJson;
      expect(structured).toBeDefined();
      expect(structured.roleTitle).toBeDefined();
      expect(structured.seniority).toBe("SENIOR");
      expect(structured.experienceYears.min).toBe(5);
      expect(structured.mustHaveSkills.length).toBeGreaterThan(0);
      expect(structured.responsibilities.length).toBeGreaterThan(0);
      expect(structured.techStackCategories).toBeDefined();
      expect(structured.techStackCategories.languages).toBeDefined();
      expect(structured.techStackCategories.frameworks).toBeDefined();
      expect(structured.techStackCategories.databases).toBeDefined();
      expect(structured.techStackCategories.cloudAndDevops).toBeDefined();
    });

    it("2. returns HTTP 400 when rawText is under 100 characters", async () => {
      const res = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Junior Dev",
          rawText: "Short text below 100 characters.",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("at least 100 characters");
    });

    it("3. returns HTTP 400 when title is missing or empty", async () => {
      const res = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "",
          rawText: validJdText,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("4. returns HTTP 401 when Authorization header is missing", async () => {
      const res = await request(app)
        .post("/api/v1/job-descriptions")
        .send({
          title: "Dev",
          rawText: validJdText,
        });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/job-descriptions", () => {
    it("5. lists only the authenticated user's job descriptions, newest first", async () => {
      // Create 2 JDs for user 1
      await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "Backend SDE 1", rawText: validJdText });

      await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "Backend SDE 2", rawText: validJdText });

      // Create 1 JD for user 2
      await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ title: "User 2 Only JD", rawText: validJdText });

      // Query as User 1
      const res1 = await request(app)
        .get("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.jobDescriptions.length).toBe(2);
      expect(res1.body.data.jobDescriptions[0].title).toBe("Backend SDE 2");
      expect(res1.body.data.jobDescriptions[1].title).toBe("Backend SDE 1");
      // Check that summary list projection excludes rawText
      expect(res1.body.data.jobDescriptions[0].rawText).toBeUndefined();

      // Query as User 2
      const res2 = await request(app)
        .get("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.jobDescriptions.length).toBe(1);
      expect(res2.body.data.jobDescriptions[0].title).toBe("User 2 Only JD");
    });
  });

  describe("GET /api/v1/job-descriptions/:id", () => {
    it("6. retrieves full JD details including rawText", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "Full Stack Engineer",
          company: "Acme Corp",
          rawText: validJdText,
        });

      const jdId = createRes.body.data.jobDescription.id;

      const res = await request(app)
        .get(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.jobDescription.id).toBe(jdId);
      expect(res.body.data.jobDescription.rawText).toBe(validJdText.trim());
      expect(res.body.data.jobDescription.structuredJson).toBeDefined();
    });

    it("7. enforces BOLA/IDOR protection (User 2 cannot read User 1's JD -> 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "User 1 Secret Role", rawText: validJdText });

      const jdId = createRes.body.data.jobDescription.id;

      const res = await request(app)
        .get(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("8. returns 404 for non-existent ID", async () => {
      const res = await request(app)
        .get("/api/v1/job-descriptions/123e4567-e89b-12d3-a456-426614174000")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
    });

    it("8b. returns 400 when ID param is not a valid UUID", async () => {
      const res = await request(app)
        .get("/api/v1/job-descriptions/not-a-valid-uuid")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/job-descriptions/:id/reanalyze", () => {
    it("9. re-analyzes existing job description cleanly", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "DevOps Engineer", rawText: validJdText });

      const jdId = createRes.body.data.jobDescription.id;

      const res = await request(app)
        .post(`/api/v1/job-descriptions/${jdId}/reanalyze`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobDescription.id).toBe(jdId);
      expect(res.body.data.jobDescription.structuredJson).toBeDefined();
    });

    it("10. enforces BOLA/IDOR protection on reanalyze (User 2 cannot reanalyze User 1's JD -> 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "DevOps Engineer", rawText: validJdText });

      const jdId = createRes.body.data.jobDescription.id;

      const res = await request(app)
        .post(`/api/v1/job-descriptions/${jdId}/reanalyze`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/job-descriptions/:id", () => {
    it("11. deletes a job description and verifies subsequent GET returns 404", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "To Delete", rawText: validJdText });

      const jdId = createRes.body.data.jobDescription.id;

      const delRes = await request(app)
        .delete(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(404);
    });

    it("12. enforces BOLA/IDOR protection on delete (User 2 cannot delete User 1's JD -> 404)", async () => {
      const createRes = await request(app)
        .post("/api/v1/job-descriptions")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ title: "Protected JD", rawText: validJdText });

      const jdId = createRes.body.data.jobDescription.id;

      const delRes = await request(app)
        .delete(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(delRes.status).toBe(404);

      // Verify still exists for User 1
      const getRes = await request(app)
        .get(`/api/v1/job-descriptions/${jdId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(200);
    });
  });
});
