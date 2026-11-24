import { describe, it, expect } from "vitest";
import {
  normalizeSkill,
  calculateDeterministicMatch,
} from "../../src/modules/matching/matching.calculator.js";
import { deterministicQualitativeAnalysis } from "../../src/modules/matching/matching.fallback.js";
import {
  MatchQualitativeAnalysisSchema,
  CreateMatchSchema,
  MatchIdParamSchema,
} from "../../src/modules/matching/matching.schemas.js";
import { PromptRegistry } from "../../src/core/ai/prompt.registry.js";
import type { Resume, JobDescription } from "@prisma/client";

describe("Matching Calculator & Schemas Unit Tests", () => {
  describe("normalizeSkill", () => {
    it("normalizes common tech synonyms and aliases to canonical keys", () => {
      expect(normalizeSkill("Node.js")).toBe("node.js");
      expect(normalizeSkill("nodejs")).toBe("node.js");
      expect(normalizeSkill("node")).toBe("node.js");
      expect(normalizeSkill("PostgreSQL")).toBe("postgresql");
      expect(normalizeSkill("postgres")).toBe("postgresql");
      expect(normalizeSkill("TypeScript")).toBe("typescript");
      expect(normalizeSkill("TS")).toBe("typescript");
      expect(normalizeSkill("React")).toBe("react");
      expect(normalizeSkill("ReactJS")).toBe("react");
      expect(normalizeSkill("K8s")).toBe("kubernetes");
      expect(normalizeSkill("Amazon Web Services")).toBe("aws");
    });
  });

  describe("calculateDeterministicMatch", () => {
    const mockResume: Resume = {
      id: "resume-123",
      userId: "user-123",
      originalFileName: "john_doe_resume.pdf",
      storedFileName: "stored.pdf",
      mimeType: "application/pdf",
      fileExtension: "pdf",
      fileSize: 1024,
      storagePath: "/tmp/stored.pdf",
      extractedText: `
        John Doe — Senior Backend Engineer
        5+ years of experience building resilient microservices using TypeScript, Node.js, and PostgreSQL.
        Proficient with Docker, AWS, Git, Redis, and RESTful APIs.
      `,
      parsedData: {
        skills: {
          technical: ["TypeScript", "Node.js", "PostgreSQL", "Redis"],
          tools: ["Docker", "AWS", "Git"],
          soft: ["Leadership", "Problem Solving"],
        },
      },
      processingStatus: "PROCESSED",
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockJd: JobDescription = {
      id: "jd-123",
      userId: "user-123",
      title: "Senior Backend Engineer",
      company: "TechQuery Innovations",
      rawText: "Looking for Senior Backend Engineer with Node.js, TypeScript, and PostgreSQL experience.",
      structuredJson: {
        roleTitle: "Senior Backend Engineer",
        seniority: "SENIOR",
        experienceYears: { min: 5, max: 8 },
        mustHaveSkills: ["Node.js", "TypeScript", "PostgreSQL"],
        niceToHaveSkills: ["Docker", "AWS", "Redis"],
        responsibilities: ["Build backend APIs", "Optimize SQL queries"],
        techStackCategories: {
          languages: ["TypeScript", "SQL"],
          frameworks: ["Node.js"],
          databases: ["PostgreSQL", "Redis"],
          cloudAndDevops: ["Docker", "AWS"],
          toolsAndOther: ["Git", "REST APIs"],
        },
      },
      providerUsed: "MOCK",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("1. calculates high match score (>= 90%) for candidate with all required skills and experience", () => {
      const result = calculateDeterministicMatch(mockResume, mockJd, 5);

      expect(result.matchScore).toBeGreaterThanOrEqual(90);
      expect(result.scoreBreakdown.mustHaveSkillsScore).toBe(100);
      expect(result.scoreBreakdown.niceToHaveSkillsScore).toBe(100);
      expect(result.scoreBreakdown.experienceScore).toBe(100);
      expect(result.missingSkills.length).toBe(0);
      expect(result.matchedSkills.length).toBeGreaterThanOrEqual(3);
    });

    it("2. assigns HIGH importance to missing must-have skills and MEDIUM to missing nice-to-have skills", () => {
      const jdWithMissing: JobDescription = {
        ...mockJd,
        structuredJson: {
          ...mockJd.structuredJson,
          mustHaveSkills: ["Node.js", "Go", "Cassandra"], // Go and Cassandra missing
          niceToHaveSkills: ["Kubernetes", "GraphQL"],      // Kubernetes and GraphQL missing
        } as any,
      };

      const result = calculateDeterministicMatch(mockResume, jdWithMissing, 5);

      const highMissing = result.missingSkills.filter((m) => m.importance === "HIGH");
      const medMissing = result.missingSkills.filter((m) => m.importance === "MEDIUM");

      expect(highMissing.some((m) => m.skill === "Go")).toBe(true);
      expect(highMissing.some((m) => m.skill === "Cassandra")).toBe(true);
      expect(medMissing.some((m) => m.skill === "Kubernetes")).toBe(true);
      expect(medMissing.some((m) => m.skill === "GraphQL")).toBe(true);
      expect(result.matchScore).toBeLessThan(80);
    });

    it("3. penalizes experience score when candidate tenure is well below minimum requirements", () => {
      const result = calculateDeterministicMatch(mockResume, mockJd, 1); // 1 yr vs 5 yrs min

      expect(result.scoreBreakdown.experienceScore).toBeLessThanOrEqual(50);
      expect(result.matchScore).toBeLessThan(90);
    });

    it("4. computes low match score (<= 35%) when skills and domain have zero overlap", () => {
      const unrelatedResume: Resume = {
        ...mockResume,
        extractedText: "Digital Marketing Specialist with 1 year of SEO and copywriting experience.",
        parsedData: {
          skills: {
            technical: ["SEO", "Content Marketing", "Canva"],
            tools: ["Google Analytics"],
            soft: ["Communication"],
          },
        },
      };

      const result = calculateDeterministicMatch(unrelatedResume, mockJd, 1);

      expect(result.scoreBreakdown.mustHaveSkillsScore).toBe(0);
      expect(result.matchScore).toBeLessThanOrEqual(35);
    });
  });

  describe("deterministicQualitativeAnalysis", () => {
    it("produces schema-valid qualitative evaluation matching MatchQualitativeAnalysisSchema", () => {
      const mockCalc = {
        matchScore: 82,
        scoreBreakdown: {
          mustHaveSkillsScore: 100,
          niceToHaveSkillsScore: 66,
          experienceScore: 75,
          domainScore: 80,
        },
        matchedSkills: ["TypeScript", "Node.js", "PostgreSQL"],
        missingSkills: [
          { skill: "Docker", importance: "MEDIUM" as const, category: "Preferred Qualifications" },
        ],
        candidateYearsOfExperience: 4,
        requiredYearsMin: 5,
      };

      const qualitative = deterministicQualitativeAnalysis(mockCalc, "Senior Backend Engineer", "Acme");

      expect(MatchQualitativeAnalysisSchema.safeParse(qualitative).success).toBe(true);
      expect(qualitative.strengths.length).toBeGreaterThanOrEqual(1);
      expect(qualitative.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(qualitative.experienceMatch).toContain("Senior Backend Engineer");
      expect(qualitative.projectRelevance).toContain("TypeScript");
    });
  });

  describe("Validation Schemas", () => {
    it("validates compliant CreateMatchSchema payload", () => {
      const payload = {
        resumeId: "123e4567-e89b-12d3-a456-426614174000",
        jdId: "123e4567-e89b-12d3-a456-426614174001",
      };
      expect(CreateMatchSchema.safeParse(payload).success).toBe(true);
    });

    it("rejects invalid UUIDs in CreateMatchSchema and MatchIdParamSchema", () => {
      expect(CreateMatchSchema.safeParse({ resumeId: "invalid", jdId: "123" }).success).toBe(false);
      expect(MatchIdParamSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
    });
  });

  describe("PromptRegistry buildMatchAnalysisPrompt", () => {
    it("wraps documents in security delimiters and includes factual overlap data", () => {
      const prompt = PromptRegistry.buildMatchAnalysisPrompt({
        resumeText: "Candidate Resume Text Here",
        jdTitle: "Principal Systems Engineer",
        jdCompany: "TechQuery Global",
        jdText: "JD Text Here",
        matchedSkills: ["Node.js", "TypeScript"],
        missingSkills: [{ skill: "Rust", importance: "HIGH", category: "Required" }],
        scoreBreakdown: {
          mustHaveSkillsScore: 80,
          niceToHaveSkillsScore: 70,
          experienceScore: 100,
          domainScore: 90,
        },
        overallMatchScore: 85,
      });

      expect(prompt).toContain("<resume_context>");
      expect(prompt).toContain("</resume_context>");
      expect(prompt).toContain("<job_description_context>");
      expect(prompt).toContain("</job_description_context>");
      expect(prompt).toContain("SECURITY DIRECTIVE");
      expect(prompt).toContain("Node.js, TypeScript");
      expect(prompt).toContain("Rust (HIGH)");
      expect(prompt).toContain("85/100");
    });
  });
});
