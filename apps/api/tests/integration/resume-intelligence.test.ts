import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { config } from "../../src/core/config/index.js";

describe("Resume Intelligence & ATS Audit Integration Tests", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  const validPdfPath = path.resolve("./node_modules/pdf-parse/test/data/01-valid.pdf");
  const samplePdfBuffer = fsSync.readFileSync(validPdfPath);

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const u1 = await prisma.user.create({
      data: {
        name: "Resume Intelligence User 1",
        email: "intelligence1@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({ userId: u1.id, role: u1.role, tier: u1.tier });

    const u2 = await prisma.user.create({
      data: {
        name: "Resume Intelligence User 2",
        email: "intelligence2@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user2Id = u2.id;
    user2Token = JwtService.signAccessToken({ userId: u2.id, role: u2.role, tier: u2.tier });
  });

  afterEach(async () => {
    // Clean up uploaded files in config.STORAGE_DIR
    await fs.rm(path.resolve(config.STORAGE_DIR), { recursive: true, force: true }).catch(() => {});
  });

  it("1. analyzes resume successfully via AI Gateway with scoring, section breakdown, and structured graph", async () => {
    // Step 1: Upload a valid resume
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "sample_resume.pdf");

    expect(uploadRes.status).toBe(201);
    const resumeId = uploadRes.body.data.resume.id;

    // Step 2: Trigger AI-driven Resume Intelligence Analysis
    const analyzeRes = await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.success).toBe(true);

    const { analysis, parsedData } = analyzeRes.body.data;

    // Validate ATS Analysis
    expect(analysis).toBeDefined();
    expect(analysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(analysis.atsScore).toBeLessThanOrEqual(100);
    expect(analysis.sectionScores).toBeDefined();
    expect(typeof analysis.sectionScores.contact).toBe("number");
    expect(typeof analysis.sectionScores.skills).toBe("number");
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(Array.isArray(analysis.issues)).toBe(true);
    expect(analysis.improvements.length).toBeGreaterThan(0);
    expect(analysis.improvements[0]).toHaveProperty("original");
    expect(analysis.improvements[0]).toHaveProperty("suggested");
    expect(analysis.improvements[0]).toHaveProperty("reason");

    // Validate Structured Graph
    expect(parsedData).toBeDefined();
    expect(parsedData.summary).toBeDefined();
    expect(parsedData.skills.technical.length).toBeGreaterThan(0);
    expect(parsedData.experience.length).toBeGreaterThan(0);
    expect(parsedData.projects.length).toBeGreaterThan(0);

    // Verify DB persistence
    const dbAnalysis = await prisma.resumeAnalysis.findUnique({
      where: { resumeId },
    });
    expect(dbAnalysis).toBeDefined();
    expect(dbAnalysis?.atsScore).toBe(analysis.atsScore);

    const dbResume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });
    expect(dbResume?.parsedData).toBeDefined();
  });

  it("2. re-analyzing an existing resume updates/upserts cleanly without duplicate key error", async () => {
    // Upload
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "reanalyze_test.pdf");

    const resumeId = uploadRes.body.data.resume.id;

    // First analysis
    const res1 = await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res1.status).toBe(200);

    // Second analysis (upsert)
    const res2 = await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.analysis.id).toBe(res1.body.data.analysis.id);

    // Verify only one analysis record exists in DB
    const count = await prisma.resumeAnalysis.count({
      where: { resumeId },
    });
    expect(count).toBe(1);
  });

  it("3. retrieves persisted ATS analysis via GET /api/v1/resumes/:id/analysis", async () => {
    // Upload & Analyze
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "analysis_get.pdf");

    const resumeId = uploadRes.body.data.resume.id;

    await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);

    // GET analysis
    const getRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}/analysis`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.analysis.resumeId).toBe(resumeId);
    expect(getRes.body.data.analysis.atsScore).toBeGreaterThanOrEqual(0);
  });

  it("4. retrieves structured parsed data via GET /api/v1/resumes/:id/parsed-data", async () => {
    // Upload & Analyze
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "parsed_get.pdf");

    const resumeId = uploadRes.body.data.resume.id;

    await request(app)
      .post(`/api/v1/resumes/${resumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);

    // GET parsed-data
    const getRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}/parsed-data`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.parsedData.skills).toBeDefined();
    expect(getRes.body.data.parsedData.summary).toBeDefined();
  });

  it("5. returns 404 when querying analysis or parsed-data before analysis has run", async () => {
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "not_analyzed_yet.pdf");

    const resumeId = uploadRes.body.data.resume.id;

    const analysisRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}/analysis`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(analysisRes.status).toBe(404);
    expect(analysisRes.body.error.code).toBe("ANALYSIS_NOT_FOUND");

    const parsedRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}/parsed-data`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(parsedRes.status).toBe(404);
    expect(parsedRes.body.error.code).toBe("PARSED_DATA_NOT_FOUND");
  });

  it("6. enforces tenant isolation and BOLA/IDOR protection across users", async () => {
    // User 1 uploads and analyzes a resume
    const uploadRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "u1_secret_resume.pdf");

    const u1ResumeId = uploadRes.body.data.resume.id;

    await request(app)
      .post(`/api/v1/resumes/${u1ResumeId}/analyze`)
      .set("Authorization", `Bearer ${user1Token}`);

    // User 2 attempts to analyze User 1's resume
    const unauthorizedAnalyze = await request(app)
      .post(`/api/v1/resumes/${u1ResumeId}/analyze`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(unauthorizedAnalyze.status).toBe(404);

    // User 2 attempts to view User 1's analysis
    const unauthorizedGetAnalysis = await request(app)
      .get(`/api/v1/resumes/${u1ResumeId}/analysis`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(unauthorizedGetAnalysis.status).toBe(404);

    // User 2 attempts to view User 1's parsed-data
    const unauthorizedGetParsed = await request(app)
      .get(`/api/v1/resumes/${u1ResumeId}/parsed-data`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(unauthorizedGetParsed.status).toBe(404);
  });

  it("7. rejects unauthenticated requests with 401 Unauthorized", async () => {
    const res = await request(app).post("/api/v1/resumes/some-uuid/analyze");
    expect(res.status).toBe(401);
  });
});
