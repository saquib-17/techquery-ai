import type { Resume, JobDescription } from "@prisma/client";
import type { ScoreBreakdown, MissingSkillItem } from "./matching.schemas.js";
import { deterministicParseJd } from "../job-description/job-description.fallback.js";
import type { ParsedJdData } from "../job-description/job-description.schemas.js";

export interface DeterministicMatchResult {
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: MissingSkillItem[];
  candidateYearsOfExperience: number;
  requiredYearsMin: number;
}

// Canonical skill normalization mappings (aliases -> canonical key)
const SKILL_ALIASES: Record<string, string> = {
  "node": "node.js",
  "nodejs": "node.js",
  "node.js": "node.js",
  "ts": "typescript",
  "typescript": "typescript",
  "js": "javascript",
  "javascript": "javascript",
  "postgres": "postgresql",
  "postgresql": "postgresql",
  "react": "react",
  "reactjs": "react",
  "react.js": "react",
  "next": "next.js",
  "nextjs": "next.js",
  "next.js": "next.js",
  "nest": "nestjs",
  "nestjs": "nestjs",
  "nest.js": "nestjs",
  "express": "express",
  "expressjs": "express",
  "express.js": "express",
  "k8s": "kubernetes",
  "kubernetes": "kubernetes",
  "docker": "docker",
  "aws": "aws",
  "amazon web services": "aws",
  "gcp": "gcp",
  "google cloud": "gcp",
  "azure": "azure",
  "mongo": "mongodb",
  "mongodb": "mongodb",
  "redis": "redis",
  "python": "python",
  "py": "python",
  "java": "java",
  "golang": "go",
  "go": "go",
  "git": "git",
  "rest": "rest apis",
  "restful": "rest apis",
  "rest api": "rest apis",
  "rest apis": "rest apis",
  "graphql": "graphql",
  "sql": "sql",
  "prisma": "prisma",
  "prisma orm": "prisma",
  "ci/cd": "ci/cd",
  "cicd": "ci/cd",
};

/**
 * Normalizes a raw skill string to a canonical lowercase token.
 */
export function normalizeSkill(skill: string): string {
  const clean = skill.toLowerCase().trim().replace(/[\(\)]/g, "");
  return SKILL_ALIASES[clean] || clean;
}

function matchesTokenBoundary(haystackLower: string, needleLower: string): boolean {
  if (needleLower.length < 2) return false;
  const escaped = needleLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryRegex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
  return boundaryRegex.test(haystackLower);
}

/**
 * Checks whether candidate skill set contains the target skill (by exact, normalized, alias,
 * phrase-token boundary match, or whole-token match in extracted resume text).
 */
export function skillSetHas(
  candidateSkillTokens: Set<string>,
  fullResumeTextLower: string,
  targetSkill: string
): boolean {
  const normalizedTarget = normalizeSkill(targetSkill);
  if (candidateSkillTokens.has(normalizedTarget)) return true;

  // Check alias table
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (canonical === normalizedTarget && candidateSkillTokens.has(alias)) {
      return true;
    }
  }

  // Check if any candidate skill (or its aliases) appears as a distinct token inside a phrase-level JD requirement
  const targetLower = targetSkill.toLowerCase();
  for (const candidateToken of candidateSkillTokens) {
    if (matchesTokenBoundary(targetLower, candidateToken)) {
      return true;
    }
    for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
      if (canonical === candidateToken && matchesTokenBoundary(targetLower, alias)) {
        return true;
      }
    }
  }

  // Fallback: check token boundary in raw extracted resume text
  return matchesTokenBoundary(fullResumeTextLower, normalizedTarget);
}

/**
 * Extracts candidate years of experience from profile or resume text.
 */
function extractCandidateExperienceYears(resumeText: string, declaredYears?: number | null): number {
  if (declaredYears !== undefined && declaredYears !== null && declaredYears >= 0) {
    return declaredYears;
  }

  // Scan resume text for years patterns
  const match = resumeText.match(/(\d+)\+?\s*years?(?:\s+of)?\s+experience/i);
  if (match) {
    const yrs = parseInt(match[1], 10);
    if (!isNaN(yrs) && yrs <= 30) return yrs;
  }

  // Check date ranges (e.g. 2020 - Present, 2021 - 2024)
  const currentYear = new Date().getFullYear();
  const yearMatches = [...resumeText.matchAll(/\b(20\d{2})\b/g)].map((m) => parseInt(m[1], 10));
  if (yearMatches.length >= 2) {
    const minYear = Math.min(...yearMatches);
    const maxYear = Math.min(currentYear, Math.max(...yearMatches));
    const span = maxYear - minYear;
    if (span >= 0 && span <= 25) return span;
  }

  return 2; // Reasonable default for mid-tier
}

/**
 * Pure deterministic calculation engine for Resume-to-Job matching.
 */
export function calculateDeterministicMatch(
  resume: Resume,
  jobDescription: JobDescription,
  declaredCandidateYears?: number | null
): DeterministicMatchResult {
  const resumeText = resume.extractedText || "";
  const resumeTextLower = resumeText.toLowerCase();

  // 1. Gather all candidate skill tokens (from parsedData and text)
  const candidateSkillTokens = new Set<string>();
  const parsed = resume.parsedData as any;
  if (parsed?.skills) {
    if (Array.isArray(parsed.skills.technical)) {
      parsed.skills.technical.forEach((s: string) => candidateSkillTokens.add(normalizeSkill(s)));
    }
    if (Array.isArray(parsed.skills.tools)) {
      parsed.skills.tools.forEach((s: string) => candidateSkillTokens.add(normalizeSkill(s)));
    }
    if (Array.isArray(parsed.skills.soft)) {
      parsed.skills.soft.forEach((s: string) => candidateSkillTokens.add(normalizeSkill(s)));
    }
  }

  // 2. Parse JD structured representation
  let parsedJd = jobDescription.structuredJson as unknown as ParsedJdData;
  if (!parsedJd || !Array.isArray(parsedJd.mustHaveSkills)) {
    parsedJd = deterministicParseJd(jobDescription.title, jobDescription.rawText);
  }

  const mustHaveSkills = parsedJd.mustHaveSkills || [];
  const niceToHaveSkills = parsedJd.niceToHaveSkills || [];
  const jdMinYears = parsedJd.experienceYears?.min ?? 2;

  // 3. Match Must-Have Skills
  const matchedMust: string[] = [];
  const missingMust: string[] = [];

  for (const skill of mustHaveSkills) {
    if (skillSetHas(candidateSkillTokens, resumeTextLower, skill)) {
      matchedMust.push(skill);
    } else {
      missingMust.push(skill);
    }
  }

  // 4. Match Nice-To-Have Skills
  const matchedNice: string[] = [];
  const missingNice: string[] = [];

  for (const skill of niceToHaveSkills) {
    if (skillSetHas(candidateSkillTokens, resumeTextLower, skill)) {
      matchedNice.push(skill);
    } else {
      missingNice.push(skill);
    }
  }

  // 5. Compute Component Scores (0 - 100)
  // 5a. Must-Have Score (50% weight)
  const mustHaveScore =
    mustHaveSkills.length > 0
      ? Math.round((matchedMust.length / mustHaveSkills.length) * 100)
      : 100;

  // 5b. Nice-To-Have Score (20% weight)
  const niceToHaveScore =
    niceToHaveSkills.length > 0
      ? Math.round((matchedNice.length / niceToHaveSkills.length) * 100)
      : 100;

  // 5c. Experience Score (20% weight)
  const candidateYears = extractCandidateExperienceYears(resumeText, declaredCandidateYears);
  let experienceScore = 100;
  if (jdMinYears > 0) {
    if (candidateYears >= jdMinYears) {
      experienceScore = 100;
    } else if (candidateYears === jdMinYears - 1) {
      experienceScore = 75;
    } else if (candidateYears === jdMinYears - 2) {
      experienceScore = 55;
    } else {
      const ratio = candidateYears / jdMinYears;
      experienceScore = Math.max(20, Math.round(ratio * 70));
    }
  }

  // 5d. Domain / Tech Stack Keyword Overlap (10% weight)
  const categories = parsedJd.techStackCategories || {
    languages: [],
    frameworks: [],
    databases: [],
    cloudAndDevops: [],
    toolsAndOther: [],
  };

  let totalCategoriesWithKeywords = 0;
  let matchedCategories = 0;

  for (const catItems of Object.values(categories)) {
    if (Array.isArray(catItems) && catItems.length > 0) {
      totalCategoriesWithKeywords++;
      const hasOverlap = catItems.some((skill) =>
        skillSetHas(candidateSkillTokens, resumeTextLower, skill)
      );
      if (hasOverlap) matchedCategories++;
    }
  }

  const domainScore =
    totalCategoriesWithKeywords > 0
      ? Math.round((matchedCategories / totalCategoriesWithKeywords) * 100)
      : 80;

  // 6. Overall Weighted Score (50% must, 20% nice, 20% exp, 10% domain)
  const rawWeighted =
    mustHaveScore * 0.50 +
    niceToHaveScore * 0.20 +
    experienceScore * 0.20 +
    domainScore * 0.10;

  const matchScore = Math.min(100, Math.max(0, Math.round(rawWeighted)));

  // 7. Format Missing Skills List
  const missingSkills: MissingSkillItem[] = [
    ...missingMust.map((s) => ({
      skill: s,
      importance: "HIGH" as const,
      category: "Required Qualifications",
    })),
    ...missingNice.map((s) => ({
      skill: s,
      importance: "MEDIUM" as const,
      category: "Preferred Qualifications",
    })),
  ];

  const matchedSkills = [...matchedMust, ...matchedNice];

  return {
    matchScore,
    scoreBreakdown: {
      mustHaveSkillsScore: mustHaveScore,
      niceToHaveSkillsScore: niceToHaveScore,
      experienceScore,
      domainScore,
    },
    matchedSkills,
    missingSkills,
    candidateYearsOfExperience: candidateYears,
    requiredYearsMin: jdMinYears,
  };
}
