import { z } from "zod";

export const SeniorityEnum = z.enum([
  "INTERN",
  "ENTRY",
  "MID",
  "SENIOR",
  "LEAD",
  "UNKNOWN",
]);
export type Seniority = z.infer<typeof SeniorityEnum>;

export const ExperienceYearsSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(0).nullable(),
});
export type ExperienceYears = z.infer<typeof ExperienceYearsSchema>;

export const TechStackCategoriesSchema = z.object({
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  databases: z.array(z.string()),
  cloudAndDevops: z.array(z.string()),
  toolsAndOther: z.array(z.string()),
});
export type TechStackCategories = z.infer<typeof TechStackCategoriesSchema>;

export const ParsedJdDataSchema = z.object({
  roleTitle: z.string().min(1, "Role title is required"),
  seniority: SeniorityEnum,
  experienceYears: ExperienceYearsSchema,
  mustHaveSkills: z.array(z.string()).min(1, "At least one must-have skill is required"),
  niceToHaveSkills: z.array(z.string()),
  responsibilities: z.array(z.string()).min(1, "At least one responsibility is required"),
  techStackCategories: TechStackCategoriesSchema,
});
export type ParsedJdData = z.infer<typeof ParsedJdDataSchema>;

export const CreateJobDescriptionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150, "Title cannot exceed 150 characters"),
  company: z
    .string()
    .trim()
    .min(1, "Company cannot be empty")
    .max(150, "Company cannot exceed 150 characters")
    .optional(),
  rawText: z
    .string()
    .trim()
    .min(100, "Job description must be at least 100 characters")
    .max(25000, "Job description cannot exceed 25,000 characters"),
});
export type CreateJobDescriptionInput = z.infer<typeof CreateJobDescriptionSchema>;

export const JdIdParamSchema = z.object({
  id: z.string().uuid("Invalid job description ID format"),
});
export type JdIdParam = z.infer<typeof JdIdParamSchema>;
