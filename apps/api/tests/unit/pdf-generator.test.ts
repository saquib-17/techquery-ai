import { describe, it, expect } from "vitest";
import {
  PdfGeneratorService,
  pdfGeneratorService,
  type ExportDocumentInput,
} from "../../src/core/export/pdf-generator.service.js";

describe("PDF Generator Service Unit Tests (Phase I)", () => {
  const service = new PdfGeneratorService();

  const sampleInput: ExportDocumentInput = {
    title: "Senior Backend Engineer Interview Prep",
    subtitle: "Focus: Distributed Systems & Concurrency | Target: Stripe",
    generatedAt: new Date("2026-11-24T12:00:00Z"),
    items: [
      {
        index: 1,
        category: "CODING",
        difficulty: "HARD",
        targetedSkill: "TypeScript",
        questionText: "Implement a thread-safe rate limiter using the Token Bucket algorithm.",
        interviewerIntent: "Evaluates concurrency handling and time window calculations.",
        keyEvaluationPoints: ["Clock skew defense", "Refill rate arithmetic"],
        answer: {
          shortSummary: "Token Bucket provides burst handling while maintaining a smooth average rate.",
          detailedExplanation: "We maintain a count of tokens and a last-refill timestamp...",
          codeSnippet: "export class TokenBucketRateLimiter { private tokens: number = 10; }",
          timeComplexity: "O(1)",
          spaceComplexity: "O(1)",
          commonMistakes: ["Using setInterval for refills instead of delta-time calculation"],
        },
      },
      {
        index: 2,
        category: "BEHAVIORAL",
        difficulty: "MEDIUM",
        targetedSkill: "Conflict Resolution",
        questionText: "Describe a situation where you had a technical disagreement with a team member.",
        interviewerIntent: "Assesses empathy, de-escalation, and objective trade-off evaluation.",
        keyEvaluationPoints: ["STAR structure", "Data-driven resolution"],
        answer: {
          shortSummary: "When debating monolith vs microservices for our core billing flow, I drove an empirical benchmark.",
          detailedExplanation: "**Situation**: During sprint planning...\n\n**Task**: We needed to align on architecture...\n\n**Action**: I created a proof of concept...\n\n**Result**: Delivered on time with consensus.",
          codeSnippet: null,
          timeComplexity: null,
          spaceComplexity: null,
          commonMistakes: ["Focusing on personal conflict rather than the technical issue"],
        },
      },
      {
        index: 3,
        category: "SYSTEM_DESIGN",
        difficulty: "HARD",
        targetedSkill: "Kafka",
        questionText: "Design a real-time event streaming pipeline processing 100k events/sec.",
        interviewerIntent: "Evaluates partition key strategies and consumer group rebalancing.",
        keyEvaluationPoints: ["Partition skew", "At-least-once delivery"],
        answer: null, // Unanswered item check
      },
    ],
  };

  it("1. generates a valid binary PDF buffer starting with %PDF- header", async () => {
    const buffer = await service.generateBuffer(sampleInput);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    const header = buffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("2. renders multi-item document with both answered and unanswered questions", async () => {
    const buffer = await service.generateBuffer(sampleInput);
    const pdfText = buffer.toString("latin1");

    // Check title presence
    expect(pdfText).toContain("Senior Backend Engineer Interview Prep");
    // Check brand header
    expect(pdfText).toContain("TECHQUERY AI");
  });

  it("3. handles single question with empty evaluation points and answers cleanly", async () => {
    const minimalInput: ExportDocumentInput = {
      title: "Minimal Prep Sheet",
      generatedAt: new Date(),
      items: [
        {
          index: 1,
          category: "THEORETICAL",
          difficulty: "EASY",
          targetedSkill: "SQL",
          questionText: "What is an index?",
          interviewerIntent: "Basic DB concepts.",
          keyEvaluationPoints: [],
          answer: null,
        },
      ],
    };

    const buffer = await service.generateBuffer(minimalInput);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("4. exports singleton pdfGeneratorService instance", () => {
    expect(pdfGeneratorService).toBeInstanceOf(PdfGeneratorService);
  });
});
