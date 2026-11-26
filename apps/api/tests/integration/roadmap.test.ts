import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("AI Learning Roadmap Studio API Integration Tests (V2.3)", () => {
  const app = createApp();
  let ownerToken: string;
  let otherToken: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const owner = await prisma.user.create({
      data: {
        name: "Roadmap Owner",
        email: "roadmap.owner@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    const other = await prisma.user.create({
      data: {
        name: "Other User",
        email: "roadmap.other@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });

    ownerToken = JwtService.signAccessToken({
      userId: owner.id,
      role: owner.role,
      tier: owner.tier,
    });
    otherToken = JwtService.signAccessToken({
      userId: other.id,
      role: other.role,
      tier: other.tier,
    });
  });

  it("generates, lists, toggles tasks, enforces ownership, and deletes a learning roadmap", async () => {
    const genRes = await request(app)
      .post("/api/v1/roadmaps/generate")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        targetRole: "Backend Engineer",
        durationWeeks: 12,
        dailyHours: 2,
        currentLevel: "INTERMEDIATE",
        focusSkills: ["PostgreSQL", "Redis", "System Design"],
      });

    expect(genRes.status).toBe(201);
    const created = genRes.body.data.roadmap;
    expect(created.targetRole).toBe("Backend Engineer");
    expect(created.durationWeeks).toBe(12);
    expect(created.phases.length).toBeGreaterThanOrEqual(2);
    expect(created.completedTasks).toBe(0);
    expect(created.totalTasks).toBeGreaterThanOrEqual(6);

    const firstTaskId = created.phases[0].tasks[0].id;

    // Toggle first task as completed
    const toggleRes = await request(app)
      .patch(`/api/v1/roadmaps/${created.id}/tasks`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ taskId: firstTaskId, completed: true });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.roadmap.completedTasks).toBe(1);

    // Other user cannot toggle or delete owner's roadmap
    const forbiddenToggle = await request(app)
      .patch(`/api/v1/roadmaps/${created.id}/tasks`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ taskId: firstTaskId, completed: false });
    expect(forbiddenToggle.status).toBe(403);

    const forbiddenDelete = await request(app)
      .delete(`/api/v1/roadmaps/${created.id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(forbiddenDelete.status).toBe(403);

    // List roadmaps reflects persisted task completion
    const listRes = await request(app)
      .get("/api/v1/roadmaps")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.roadmaps).toHaveLength(1);
    expect(listRes.body.data.roadmaps[0].completedTasks).toBe(1);

    // Owner deletes roadmap cleanly
    const delRes = await request(app)
      .delete(`/api/v1/roadmaps/${created.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.deleted).toBe(true);

    const afterDelList = await request(app)
      .get("/api/v1/roadmaps")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(afterDelList.body.data.roadmaps).toHaveLength(0);
  });
});
