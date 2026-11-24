import { z } from "zod";

export const ParsedResumeDataSchema = z.object({
  summary: z.string(),
  skills: z.object({
    technical: z.array(z.string()),
    tools: z.array(z.string()),
    soft: z.array(z.string()),
  }),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      duration: z.string(),
      highlights: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      techStack: z.array(z.string()),
      description: z.string(),
    })
  ),
});

export type ParsedResumeData = z.infer<typeof ParsedResumeDataSchema>;

export const ATSAuditResponseSchema = z.object({
  atsScore: z.number().int().min(0).max(100),
  sectionScores: z.object({
    contact: z.number().int().min(0).max(100),
    summary: z.number().int().min(0).max(100),
    experience: z.number().int().min(0).max(100),
    skills: z.number().int().min(0).max(100),
    education: z.number().int().min(0).max(100),
  }),
  strengths: z.array(z.string()).min(1),
  issues: z.array(z.string()),
  improvements: z.array(
    z.object({
      original: z.string(),
      suggested: z.string(),
      reason: z.string(),
    })
  ),
});

export type ATSAuditResponse = z.infer<typeof ATSAuditResponseSchema>;
