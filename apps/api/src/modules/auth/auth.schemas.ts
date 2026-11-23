import { z } from "zod";

/**
 * Registration request validation schema.
 * - name: 2 - 100 characters, trimmed
 * - email: valid email, normalized to lowercase and trimmed
 * - password: minimum 8 characters, maximum 128 characters, with lowercase, uppercase, digit, and special char
 */
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase()
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
}).strict(); // Rejects unknown extraneous fields

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Email verification request validation schema.
 * - token: hex string of 64 characters (32 bytes)
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .trim()
    .length(64, "Invalid verification token format"),
}).strict();

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Resend verification request validation schema.
 * - email: valid email address normalized to lowercase
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase()
    .max(255, "Email cannot exceed 255 characters"),
}).strict();

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/**
 * Login request validation schema.
 * - email: valid email, normalized to lowercase and trimmed
 * - password: string (min 1 char, max 128 chars)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase()
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
