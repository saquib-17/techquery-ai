import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import {
  DSA_SHEET_CATEGORIES,
  DSA_SHEET_PROBLEMS,
  type SheetSourceTag,
} from "@techquery/shared";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Master DSA Pattern Sheet API & Dataset Tests (V2.2)", () => {
  const app = createApp();
  let userToken: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const user = await prisma.user.create({
      data: {
        name: "Sheet Candidate",
        email: "sheet.candidate@example.com",
        passwordHash: "$argon2id$v=19$dummy",
        isVerified: true,
      },
    });
    userToken = JwtService.signAccessToken({
      userId: user.id,
      role: user.role,
      tier: user.tier,
    });
  });

  it("validates 300 unique problems across all 22 categories and all 6 source sheets", () => {
    expect(DSA_SHEET_PROBLEMS).toHaveLength(300);

    const slugs = new Set(DSA_SHEET_PROBLEMS.map((p) => p.slug));
    const titles = new Set(DSA_SHEET_PROBLEMS.map((p) => p.title));
    expect(slugs.size).toBe(300);
    expect(titles.size).toBe(300);

    for (const cat of DSA_SHEET_CATEGORIES) {
      const count = DSA_SHEET_PROBLEMS.filter((p) => p.category === cat).length;
      expect(count).toBeGreaterThanOrEqual(8);
    }

    const expectedSources: SheetSourceTag[] = [
      "Blind 75",
      "NeetCode 150",
      "Striver SDE",
      "Striver A2Z",
      "Grind 169",
      "Apna College",
    ];
    for (const src of expectedSources) {
      const count = DSA_SHEET_PROBLEMS.filter((p) =>
        p.sourceSheets.includes(src)
      ).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it("persists SOLVED / REVISION status, personal notes, and returns structured AI walkthrough", async () => {
    const initialRes = await request(app)
      .get("/api/v1/dsa-sheet")
      .set("Authorization", `Bearer ${userToken}`);

    expect(initialRes.status).toBe(200);
    expect(initialRes.body.data.summary.total).toBe(DSA_SHEET_PROBLEMS.length);
    expect(initialRes.body.data.summary.solved).toBe(0);

    const putSolved = await request(app)
      .put("/api/v1/dsa-sheet/two-sum/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "SOLVED", notes: "Use HashMap in O(n) time." });

    expect(putSolved.status).toBe(200);
    expect(putSolved.body.data.progress.status).toBe("SOLVED");
    expect(putSolved.body.data.progress.notes).toBe("Use HashMap in O(n) time.");

    const putRevision = await request(app)
      .put("/api/v1/dsa-sheet/coin-change/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "REVISION" });

    expect(putRevision.status).toBe(200);

    const refreshed = await request(app)
      .get("/api/v1/dsa-sheet")
      .set("Authorization", `Bearer ${userToken}`);

    expect(refreshed.body.data.summary.solved).toBe(1);
    expect(refreshed.body.data.summary.revision).toBe(1);

    const twoSum = refreshed.body.data.problems.find(
      (p: { slug: string }) => p.slug === "two-sum"
    );
    expect(twoSum.status).toBe("SOLVED");
    expect(twoSum.notes).toBe("Use HashMap in O(n) time.");

    const wtRes = await request(app)
      .post("/api/v1/dsa-sheet/two-sum/walkthrough")
      .set("Authorization", `Bearer ${userToken}`);

    expect(wtRes.status).toBe(200);
    expect(wtRes.body.data.walkthrough.problemSlug).toBe("two-sum");
    expect(wtRes.body.data.walkthrough.optimalApproach).toBeTruthy();
  });
});
