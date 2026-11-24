import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Collections & PDF Export Integration Tests (Phase I)", () => {
  const app = createApp();

  let user1Token: string;
  let user1Id: string;
  let user1QuestionSetId: string;
  let user1QuestionId1: string;
  let user1QuestionId2: string;

  let user2Token: string;
  let user2Id: string;
  let user2QuestionSetId: string;
  let user2QuestionId: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    // 1. Create User 1
    const u1 = await prisma.user.create({
      data: {
        name: "Collection User One",
        email: "user1.collections@example.com",
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

    // Create User 1 Question Set with questions and an answer
    const qs1 = await prisma.questionSet.create({
      data: {
        userId: user1Id,
        title: "Frontend Architecture Prep",
        topicFocus: "React & TypeScript",
        difficulty: "MEDIUM",
        totalCount: 2,
        providerUsed: "MOCK",
        questions: {
          create: [
            {
              category: "CODING",
              difficulty: "MEDIUM",
              targetedSkill: "React Hooks",
              questionText: "Explain how to write a custom useDebounce hook with cleanup.",
              interviewerIntent: "Assesses cleanup lifecycle and useEffect dependencies.",
              keyEvaluationPoints: ["Timer clearance on unmount", "Generic typing"],
              answer: {
                create: {
                  shortSummary: "useDebounce delays value updates until a specified inactivity threshold passes.",
                  detailedExplanation: "By storing the debounced value in state and setting a timeout in useEffect...",
                  codeSnippet: "export function useDebounce<T>(value: T, delay: number): T { ... }",
                  timeComplexity: "O(1)",
                  spaceComplexity: "O(1)",
                  commonMistakes: ["Omitting timer cleanup in return callback"],
                  style: "INTERVIEW",
                  providerUsed: "MOCK",
                },
              },
            },
            {
              category: "THEORETICAL",
              difficulty: "HARD",
              targetedSkill: "Virtual DOM",
              questionText: "How does React Fiber reconciliation algorithm achieve incremental rendering?",
              interviewerIntent: "Evaluates scheduler and work loop knowledge.",
              keyEvaluationPoints: ["Time slicing", "Fiber node linked list structure"],
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });

    user1QuestionSetId = qs1.id;
    user1QuestionId1 = qs1.questions[0].id;
    user1QuestionId2 = qs1.questions[1].id;

    // 2. Create User 2
    const u2 = await prisma.user.create({
      data: {
        name: "Collection User Two",
        email: "user2.collections@example.com",
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
        title: "User 2 Rust Prep",
        topicFocus: "Rust Ownership",
        difficulty: "HARD",
        totalCount: 1,
        providerUsed: "MOCK",
        questions: {
          create: [
            {
              category: "THEORETICAL",
              difficulty: "HARD",
              targetedSkill: "Borrow Checker",
              questionText: "Explain how lifetimes prevent dangling references in Rust.",
              interviewerIntent: "Probes compile-time memory guarantees.",
              keyEvaluationPoints: ["Stack frames", "Non-lexical lifetimes"],
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });

    user2QuestionSetId = qs2.id;
    user2QuestionId = qs2.questions[0].id;
  });

  describe("Collection CRUD Operations", () => {
    it("1. creates a new collection (201 Created)", async () => {
      const res = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Stripe Final Round Questions",
          description: "Curated list of must-practice questions for Stripe",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collection).toBeDefined();
      expect(res.body.data.collection.name).toBe("Stripe Final Round Questions");
      expect(res.body.data.collection.userId).toBe(user1Id);
    });

    it("2. lists user collections with item counts (200 OK)", async () => {
      // Create collection
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "My First Collection" });

      const collectionId = createRes.body.data.collection.id;

      // Add one item
      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      const listRes = await request(app)
        .get("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(Array.isArray(listRes.body.data.collections)).toBe(true);
      expect(listRes.body.data.collections.length).toBe(1);
      expect(listRes.body.data.collections[0].itemCount).toBe(1);
    });

    it("3. updates collection metadata (200 OK)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Draft Name" });

      const collectionId = createRes.body.data.collection.id;

      const patchRes = await request(app)
        .patch(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          name: "Updated Name",
          description: "Updated Description",
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.collection.name).toBe("Updated Name");
      expect(patchRes.body.data.collection.description).toBe("Updated Description");
    });

    it("4. deletes collection and leaves original questions intact (200 OK)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Temporary Basket" });

      const collectionId = createRes.body.data.collection.id;

      // Add item
      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      // Delete collection
      const delRes = await request(app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify collection is gone
      const getRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(getRes.status).toBe(404);

      // Verify question still exists in DB
      const question = await prisma.question.findUnique({
        where: { id: user1QuestionId1 },
      });
      expect(question).not.toBeNull();
    });
  });

  describe("Collection Items Management", () => {
    it("5. adds question to collection (201 Created) and rejects duplicate (409 Conflict)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Favorites" });

      const collectionId = createRes.body.data.collection.id;

      // Add item
      const addRes = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.item.collectionId).toBe(collectionId);
      expect(addRes.body.data.item.questionId).toBe(user1QuestionId1);

      // Attempt duplicate addition
      const dupRes = await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe("ALREADY_IN_COLLECTION");
    });

    it("6. retrieves collection with populated questions and answers (200 OK)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Detail Test" });

      const collectionId = createRes.body.data.collection.id;

      // Add both questions
      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId2 });

      const detailRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.collection.items.length).toBe(2);

      const item1 = detailRes.body.data.collection.items[0];
      expect(item1.question.id).toBe(user1QuestionId1);
      expect(item1.question.answer).toBeDefined();
      expect(item1.question.answer.shortSummary).toBeDefined();

      const item2 = detailRes.body.data.collection.items[1];
      expect(item2.question.id).toBe(user1QuestionId2);
      expect(item2.question.answer).toBeNull();
    });

    it("7. removes question from collection (200 OK)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Removal Test" });

      const collectionId = createRes.body.data.collection.id;

      // Add question
      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      // Remove question
      const removeRes = await request(app)
        .delete(`/api/v1/collections/${collectionId}/items/${user1QuestionId1}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(removeRes.status).toBe(200);
      expect(removeRes.body.success).toBe(true);

      // Verify collection is now empty
      const detailRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(detailRes.body.data.collection.items.length).toBe(0);
    });
  });

  describe("PDF Export Streaming", () => {
    it("8. streams formatted PDF for a Saved Collection (200 OK)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Exportable Collection" });

      const collectionId = createRes.body.data.collection.id;

      await request(app)
        .post(`/api/v1/collections/${collectionId}/items`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ questionId: user1QuestionId1 });

      const exportRes = await request(app)
        .get(`/api/v1/collections/${collectionId}/export/pdf`)
        .set("Authorization", `Bearer ${user1Token}`)
        .responseType("blob");

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers["content-type"]).toContain("application/pdf");
      expect(exportRes.headers["content-disposition"]).toContain("attachment");

      const buffer = Buffer.from(exportRes.body);
      expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    });

    it("9. streams formatted PDF for a Question Set (200 OK)", async () => {
      const exportRes = await request(app)
        .get(`/api/v1/question-sets/${user1QuestionSetId}/export/pdf`)
        .set("Authorization", `Bearer ${user1Token}`)
        .responseType("blob");

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers["content-type"]).toContain("application/pdf");
      expect(exportRes.headers["content-disposition"]).toContain("attachment");

      const buffer = Buffer.from(exportRes.body);
      expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    });
  });

  describe("BOLA / IDOR Security Isolation", () => {
    it("10. User 2 cannot access, update, or delete User 1's collection (404 Not Found)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "User 1 Private Basket" });

      const collectionId = createRes.body.data.collection.id;

      // GET attempt
      const getRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(getRes.status).toBe(404);

      // PATCH attempt
      const patchRes = await request(app)
        .patch(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ name: "Hacked Name" });
      expect(patchRes.status).toBe(404);

      // DELETE attempt
      const delRes = await request(app)
        .delete(`/api/v1/collections/${collectionId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(delRes.status).toBe(404);
    });

    it("11. User 2 cannot bookmark User 1's private question into User 2's collection (404 Not Found)", async () => {
      // User 2 creates collection
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ name: "User 2 Basket" });

      const user2CollectionId = createRes.body.data.collection.id;

      // User 2 attempts to add User 1's question
      const addRes = await request(app)
        .post(`/api/v1/collections/${user2CollectionId}/items`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ questionId: user1QuestionId1 });

      expect(addRes.status).toBe(404);
      expect(addRes.body.error.code).toBe("QUESTION_NOT_FOUND");
    });

    it("12. User 2 cannot export User 1's collection or question set to PDF (404 Not Found)", async () => {
      const createRes = await request(app)
        .post("/api/v1/collections")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "User 1 Export Basket" });

      const collectionId = createRes.body.data.collection.id;

      // Export collection attempt
      const expColRes = await request(app)
        .get(`/api/v1/collections/${collectionId}/export/pdf`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(expColRes.status).toBe(404);

      // Export question set attempt
      const expQsRes = await request(app)
        .get(`/api/v1/question-sets/${user1QuestionSetId}/export/pdf`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(expQsRes.status).toBe(404);
    });

    it("13. rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/collections");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_HEADER_MISSING");
    });
  });
});
