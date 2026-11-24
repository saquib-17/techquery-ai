import { z } from "zod";

// International phone number regex (allowing optional + prefix, country code, spaces, dashes, 7-15 digits)
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const createProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name cannot exceed 100 characters"),
  phoneNumber: z.string().trim().regex(phoneRegex, "Invalid phone number format").max(20).optional().nullable(),
  location: z.string().trim().max(100).optional().nullable(),
  headline: z.string().trim().max(150).optional().nullable(),
  summary: z.string().trim().max(2000).optional().nullable(),
  currentRole: z.string().trim().max(100).optional().nullable(),
  yearsOfExperience: z.coerce.number().int().min(0, "Years of experience cannot be negative").max(60, "Years of experience exceeds realistic range").optional().nullable(),
  highestEducation: z.string().trim().max(100).optional().nullable(),
  university: z.string().trim().max(150).optional().nullable(),
  graduationYear: z.coerce.number().int().min(1950, "Graduation year must be after 1950").max(new Date().getFullYear() + 10, "Graduation year exceeds allowed range").optional().nullable(),
  linkedinUrl: z.string().trim().url("Invalid LinkedIn URL").max(255).optional().nullable(),
  githubUrl: z.string().trim().url("Invalid GitHub URL").max(255).optional().nullable(),
  portfolioUrl: z.string().trim().url("Invalid Portfolio URL").max(255).optional().nullable(),
}).strict();

export const updateProfileSchema = createProfileSchema.partial().strict();

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateOnboardingSchema = z.object({
  onboardingStep: z.enum(["PROFILE", "RESUME", "SKILLS", "PREFERENCES", "COMPLETED"]).optional(),
  markCompleted: z.boolean().optional(),
}).strict();

export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;
