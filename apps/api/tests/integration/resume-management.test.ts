import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { config } from "../../src/core/config/index.js";

describe("Resume Management & Secure Ingestion Integration Tests", () => {
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
        name: "Resume User 1",
        email: "resume1@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    user1Id = u1.id;
    user1Token = JwtService.signAccessToken({ userId: u1.id, role: u1.role, tier: u1.tier });

    const u2 = await prisma.user.create({
      data: {
        name: "Resume User 2",
        email: "resume2@example.com",
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

  // --- UPLOAD & INGESTION TESTS ---

  it("1. uploads valid PDF resume and marks it as primary (first resume)", async () => {
    const res = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "my_resume.pdf");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resume.originalFileName).toBe("my_resume.pdf");
    expect(res.body.data.resume.mimeType).toBe("application/pdf");
    expect(res.body.data.resume.isPrimary).toBe(true);
    expect(res.body.data.resume.processingStatus).toBe("PROCESSED");

    // CRITICAL SECURITY ASSERTION: physical storagePath is NEVER exposed in API response
    expect(res.body.data.resume.storagePath).toBeUndefined();

    // Verify DB
    const dbResume = await prisma.resume.findUnique({ where: { id: res.body.data.resume.id } });
    expect(dbResume).toBeDefined();
    expect(dbResume?.isPrimary).toBe(true);
    expect(dbResume?.extractedText).toBeDefined();
    expect(dbResume?.extractedText?.length).toBeGreaterThan(100);
  });

  it("2. uploads second resume: stays non-primary while first remains primary", async () => {
    // Upload 1
    const res1 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "resume_1.pdf");
    expect(res1.body.data.resume.isPrimary).toBe(true);

    // Upload 2
    const res2 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "resume_2.pdf");
    expect(res2.body.data.resume.isPrimary).toBe(false);

    // Verify only one primary in DB for user
    const primaryCount = await prisma.resume.count({
      where: { userId: user1Id, isPrimary: true },
    });
    expect(primaryCount).toBe(1);
  });

  it("3. rejects spoofed file with .pdf extension but invalid magic bytes with 400", async () => {
    const fakePdf = Buffer.from("Not a real PDF file header");
    const res = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", fakePdf, "malicious.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_FILE_SIGNATURE");
  });

  it("4. rejects upload exceeding 5MB size limit with 413 Payload Too Large", async () => {
    const hugeBuffer = Buffer.alloc(5.5 * 1024 * 1024, "%PDF");
    const res = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", hugeBuffer, "huge.pdf");

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("4a. rejects corrupted PDF with valid magic bytes but malformed body with 400", async () => {
    const corruptedPdf = Buffer.from("%PDF-1.4\ncorrupted-random-binary-noise-data-without-trailer");
    const res = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", corruptedPdf, "corrupted.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(["CORRUPTED_DOCUMENT", "UNREADABLE_DOCUMENT"]).toContain(res.body.error.code);
  });

  it("4b. rejects fake ZIP disguised as DOCX with 400 Bad Request", async () => {
    // PK\x03\x04 followed by empty non-DOCX zip structure
    const fakeDocxZip = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]);
    const res = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", fakeDocxZip, "fake_doc.docx");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(["CORRUPTED_DOCUMENT", "UNREADABLE_DOCUMENT"]).toContain(res.body.error.code);
  });

  // --- MANAGEMENT & IDOR / BOLA TESTS ---

  it("5. lists authenticated user's resumes and enforces tenant isolation", async () => {
    await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "u1_resume.pdf");

    await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user2Token}`)
      .attach("file", samplePdfBuffer, "u2_resume.pdf");

    // User 1 listing: should only see user1's resume
    const res1 = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.resumes.length).toBe(1);
    expect(res1.body.data.resumes[0].originalFileName).toBe("u1_resume.pdf");

    // User 2 listing: should only see user2's resume
    const res2 = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.resumes.length).toBe(1);
    expect(res2.body.data.resumes[0].originalFileName).toBe("u2_resume.pdf");
  });

  it("6. rejects cross-user resume retrieval (IDOR/BOLA) with 404 Not Found", async () => {
    // User 1 creates resume
    const createRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "private.pdf");

    const resumeId = createRes.body.data.resume.id;

    // User 2 attempts to fetch User 1's resume
    const idorRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set("Authorization", `Bearer ${user2Token}`);

    // MUST return 404 (never reveal resource existence)
    expect(idorRes.status).toBe(404);
    expect(idorRes.body.success).toBe(false);
  });

  it("7. downloads original resume file with attachment header", async () => {
    const createRes = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "download_test.pdf");

    const resumeId = createRes.body.data.resume.id;

    const res = await request(app)
      .get(`/api/v1/resumes/${resumeId}/download`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.headers["content-disposition"]).toContain("download_test.pdf");
    expect(res.body).toBeDefined();
  });

  it("8. switches primary resume atomically", async () => {
    const res1 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "r1.pdf");

    const res2 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "r2.pdf");

    const id1 = res1.body.data.resume.id;
    const id2 = res2.body.data.resume.id;

    expect(res1.body.data.resume.isPrimary).toBe(true);
    expect(res2.body.data.resume.isPrimary).toBe(false);

    // Switch primary to r2
    const switchRes = await request(app)
      .patch(`/api/v1/resumes/${id2}/primary`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(switchRes.status).toBe(200);
    expect(switchRes.body.data.resume.isPrimary).toBe(true);

    // Verify in DB that r1 is now false and r2 is true
    const check1 = await prisma.resume.findUnique({ where: { id: id1 } });
    const check2 = await prisma.resume.findUnique({ where: { id: id2 } });
    expect(check1?.isPrimary).toBe(false);
    expect(check2?.isPrimary).toBe(true);
  });

  it("9. deletes resume and promotes remaining resume to primary", async () => {
    const res1 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "r1.pdf");

    const res2 = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${user1Token}`)
      .attach("file", samplePdfBuffer, "r2.pdf");

    const id1 = res1.body.data.resume.id;
    const id2 = res2.body.data.resume.id;

    // Delete primary r1
    const delRes = await request(app)
      .delete(`/api/v1/resumes/${id1}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(delRes.status).toBe(200);

    // Verify r2 was automatically promoted to primary
    const check2 = await prisma.resume.findUnique({ where: { id: id2 } });
    expect(check2?.isPrimary).toBe(true);
  });
});
