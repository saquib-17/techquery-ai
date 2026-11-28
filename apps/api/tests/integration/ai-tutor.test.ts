import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";

describe("Global AI Tutor Chat API Integration Tests (V2.8)", () => {
  const app = createApp();
  let userToken: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const user = await prisma.user.create({
      data: {
        name: "Tutor Learner",
        email: "tutor.learner@example.com",
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

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/api/v1/ai-tutor/chat").send({
      contextType: "CS_TOPIC",
      contextId: "os-01-what-is-an-os",
      contextTitle: "What is an Operating System?",
      messages: [{ role: "user", content: "Explain in simpler words" }],
    });
    expect(res.status).toBe(401);
  });

  it("validates payload constraints (invalid contextType, empty messages, >1000 char user message)", async () => {
    const badTypeRes = await request(app)
      .post("/api/v1/ai-tutor/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        contextType: "INVALID_TYPE",
        contextId: "id-1",
        contextTitle: "Test",
        messages: [{ role: "user", content: "Hi" }],
      });
    expect(badTypeRes.status).toBe(400);

    const tooLongRes = await request(app)
      .post("/api/v1/ai-tutor/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        contextType: "CS_TOPIC",
        contextId: "os-01-what-is-an-os",
        contextTitle: "What is an Operating System?",
        messages: [{ role: "user", content: "x".repeat(1001) }],
      });
    expect(tooLongRes.status).toBe(400);
  });

  it.each([
    ["CS_TOPIC", "os-01-what-is-an-os", "What is an Operating System?", "Give a real-life analogy"],
    ["DSA_PROBLEM", "two-sum", "Two Sum", "Explain intuition simply"],
    ["CODING_IDE", "two-sum", "Two Sum", "What edge cases break this?"],
    ["RESUME_MATCH", "match-1", "Backend Engineer Match", "What should I fix first?"],
  ] as const)(
    "returns a context-locked deterministic fallback reply for %s",
    async (contextType, contextId, contextTitle, promptText) => {
      const res = await request(app)
        .post("/api/v1/ai-tutor/chat")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          contextType,
          contextId,
          contextTitle,
          contextSummary: `Summary for ${contextTitle}`,
          messages: [{ role: "user", content: promptText }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toContain(contextTitle);
      expect(["GROQ", "OLLAMA", "FALLBACK"]).toContain(res.body.data.providerUsed);
    }
  );
});
