import type { DeterministicMatchResult } from "./matching.calculator.js";
import type { MatchQualitativeAnalysis } from "./matching.schemas.js";

/**
 * Deterministic fallback generator for qualitative Match analysis.
 * Produces structured qualitative evaluation when the AI Gateway or local LLM is offline,
 * ensuring ₹0 cost and uninterrupted user workflows.
 */
export function deterministicQualitativeAnalysis(
  calc: DeterministicMatchResult,
  roleTitle: string,
  company?: string | null
): MatchQualitativeAnalysis {
  const companyPhrase = company ? ` at ${company}` : "";

  // 1. Experience Match Narrative
  let experienceMatch = "";
  if (calc.candidateYearsOfExperience >= calc.requiredYearsMin) {
    experienceMatch = `Candidate meets or exceeds the required tenure (${calc.candidateYearsOfExperience} years verified vs. ${calc.requiredYearsMin} years required) for the ${roleTitle} position${companyPhrase}.`;
  } else {
    experienceMatch = `Candidate has approximately ${calc.candidateYearsOfExperience} years of experience compared to the ${calc.requiredYearsMin}+ years requested for ${roleTitle}${companyPhrase}; strong technical skills will be needed to offset the tenure gap.`;
  }

  // 2. Project Relevance Narrative
  let projectRelevance = "";
  if (calc.matchedSkills.length >= 3) {
    projectRelevance = `High overlap with core stack (${calc.matchedSkills.slice(0, 4).join(", ")}) indicates strong practical familiarity with the systems and domain required for this position.`;
  } else if (calc.matchedSkills.length > 0) {
    projectRelevance = `Moderate alignment demonstrated in ${calc.matchedSkills.join(", ")}; candidate will need to showcase transferable architectural experience in adjacent technologies.`;
  } else {
    projectRelevance = `Limited direct project overlap detected with target requirements; focus on demonstrating fundamental software engineering acumen and rapid learning agility.`;
  }

  // 3. Strengths (minimum 1 item)
  const strengths: string[] = [];
  if (calc.matchedSkills.length > 0) {
    strengths.push(
      `Strong verified foundation in key requested competencies: ${calc.matchedSkills.slice(0, 5).join(", ")}.`
    );
  } else {
    strengths.push("Solid baseline software engineering knowledge with potential for quick ramp-up.");
  }
  if (calc.candidateYearsOfExperience >= calc.requiredYearsMin) {
    strengths.push(
      `Verified professional tenure aligns with the seniority expectations of this role.`
    );
  }
  strengths.push(
    "Demonstrated practical exposure to standard development workflows, version control, and system architecture."
  );

  // 4. Weaknesses
  const weaknesses: string[] = [];
  const highMissing = calc.missingSkills.filter((m) => m.importance === "HIGH");
  if (highMissing.length > 0) {
    weaknesses.push(
      `Key required competencies missing from resume profile: ${highMissing.map((m) => m.skill).join(", ")}.`
    );
  }
  if (calc.candidateYearsOfExperience < calc.requiredYearsMin) {
    weaknesses.push(
      `Years of experience (${calc.candidateYearsOfExperience} yrs) is below the stated minimum (${calc.requiredYearsMin} yrs).`
    );
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Minor gap in domain-specific terminology or specialized platform nuances.");
  }

  // 5. Recommendations (minimum 1 item)
  const recommendations: string[] = [];
  if (highMissing.length > 0) {
    recommendations.push(
      `Prioritize hands-on interview preparation and architectural revision for: ${highMissing.slice(0, 3).map((m) => m.skill).join(", ")}.`
    );
  }
  recommendations.push(
    "Prepare structured STAR stories highlighting measurable system performance, reliability, and business impact."
  );
  recommendations.push(
    `Review system design patterns and data consistency trade-offs relevant to ${roleTitle}.`
  );

  return {
    experienceMatch,
    projectRelevance,
    strengths,
    weaknesses,
    recommendations,
  };
}
