import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import {
  CS_FUNDAMENTALS_TOPICS,
  CS_SUBJECTS,
} from "@techquery/shared";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/core/database/index.js";
import { assertTestDatabase, cleanTestDatabase } from "../helpers/test-db.js";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { normalizeMultilineText } from "../../src/modules/cs-fundamentals/csFundamentals.service.js";

describe("CS Core & System Design Mastery Sheet API & Dataset Tests (V2.3)", () => {
  const app = createApp();
  let userToken: string;

  beforeEach(async () => {
    await assertTestDatabase();
    await cleanTestDatabase();

    const user = await prisma.user.create({
      data: {
        name: "CS Candidate",
        email: "cs.candidate@example.com",
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

  it("validates >= 165 unique topics across all 6 core CS subjects with 1..N per-subject numbering", () => {
    expect(CS_FUNDAMENTALS_TOPICS.length).toBeGreaterThanOrEqual(165);

    const slugs = new Set(CS_FUNDAMENTALS_TOPICS.map((t) => t.slug));
    const titles = new Set(CS_FUNDAMENTALS_TOPICS.map((t) => t.title));
    expect(slugs.size).toBe(CS_FUNDAMENTALS_TOPICS.length);
    expect(titles.size).toBe(CS_FUNDAMENTALS_TOPICS.length);

    for (const subject of CS_SUBJECTS) {
      const subjectTopics = CS_FUNDAMENTALS_TOPICS.filter(
        (t) => t.subject === subject
      );
      expect(subjectTopics.length).toBeGreaterThanOrEqual(25);
      subjectTopics.forEach((topic, idx) => {
        expect(topic.order).toBe(idx + 1);
      });
    }
  });

  it("persists LEARNED / REVISION status, personal notes, and returns structured AI walkthrough", async () => {
    const initialRes = await request(app)
      .get("/api/v1/cs-fundamentals")
      .set("Authorization", `Bearer ${userToken}`);

    expect(initialRes.status).toBe(200);
    expect(initialRes.body.data.summary.total).toBe(
      CS_FUNDAMENTALS_TOPICS.length
    );
    expect(initialRes.body.data.summary.learned).toBe(0);
    expect(initialRes.body.data.summary.subjects).toHaveLength(6);

    const learnedRes = await request(app)
      .put("/api/v1/cs-fundamentals/os-process-vs-thread/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        status: "LEARNED",
        notes: "Threads share heap and code; each thread has its own stack.",
      });

    expect(learnedRes.status).toBe(200);
    expect(learnedRes.body.data.progress.status).toBe("LEARNED");

    const revRes = await request(app)
      .put("/api/v1/cs-fundamentals/sql-row-number-rank-dense-rank/progress")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "REVISION" });

    expect(revRes.status).toBe(200);
    expect(revRes.body.data.progress.status).toBe("REVISION");

    const updatedRes = await request(app)
      .get("/api/v1/cs-fundamentals")
      .set("Authorization", `Bearer ${userToken}`);

    expect(updatedRes.status).toBe(200);
    expect(updatedRes.body.data.summary.learned).toBe(1);
    expect(updatedRes.body.data.summary.revision).toBe(1);

    const osTopic = updatedRes.body.data.topics.find(
      (t: { slug: string }) => t.slug === "os-process-vs-thread"
    );
    expect(osTopic.status).toBe("LEARNED");
    expect(osTopic.notes).toContain("Threads share heap");

    const walkthroughRes = await request(app)
      .post(
        "/api/v1/cs-fundamentals/sql-row-number-rank-dense-rank/walkthrough"
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(walkthroughRes.status).toBe(200);
    const w = walkthroughRes.body.data.walkthrough;
    expect(w.topicSlug).toBe("sql-row-number-rank-dense-rank");
    expect(w.visualType).toBe("CODE");
    expect(w.conceptBreakdown).toContain("ROW_NUMBER()");
    expect(w.exampleLanguage).toBe("sql");
    expect(w.codeOrQueryExample).toContain("DENSE_RANK");
    expect(w.diagramFlow).toBe("");
    expect(w.interviewQuestions.length).toBe(3);
    expect(w.interviewQuestions[0].question).toContain("ROW_NUMBER()");
    expect(w.commonTraps.length).toBe(3);
    expect(w.commonTraps[0]).toContain("ROW_NUMBER()");

    const diagramSlugs = [
      "se-sdlc-agile-scrum-kanban",
      "sd-lld-parking-lot-elevator",
      "sd-hld-url-shortener",
      "os-process-vs-thread",
      "dbms-normalization-1nf-bcnf",
      "cn-tcp-3-way-handshake",
    ];

    for (const slug of diagramSlugs) {
      const res = await request(app)
        .post(`/api/v1/cs-fundamentals/${slug}/walkthrough`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      const tw = res.body.data.walkthrough;
      expect(tw.visualType).toBe("DIAGRAM");
      expect(tw.codeOrQueryExample).toBe("");
      expect(tw.diagramFlow).toContain("┌");
      expect(tw.comparisonPoints.length).toBeGreaterThanOrEqual(2);
    }

    const oopRes = await request(app)
      .post("/api/v1/cs-fundamentals/oop-pattern-strategy-observer/walkthrough")
      .set("Authorization", `Bearer ${userToken}`);
    expect(oopRes.status).toBe(200);
    expect(oopRes.body.data.walkthrough.visualType).toBe("CODE");
    expect(oopRes.body.data.walkthrough.exampleLanguage).toBe("java");
    expect(oopRes.body.data.walkthrough.diagramFlow).toBe("");

    const normalized = normalizeMultilineText(
      "┌────┐\\n│ A  │\\r\\n\\t──▶ B"
    );
    expect(normalized).toBe("┌────┐\n│ A  │\n    ──▶ B");
  });
});
