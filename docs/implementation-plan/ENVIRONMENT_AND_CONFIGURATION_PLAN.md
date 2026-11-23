# TechQuery AI — Environment & Configuration Plan

## Document Overview
This document specifies the environment variable schema, runtime profiles, validation rules, and secret protection standards for TechQuery AI. The platform utilizes **Zod** to strictly parse and validate all environment configurations at application boot, failing fast if any required setting is missing or invalid.

---

## 1. Typed Configuration Schema (`src/core/config/env.ts`)

Environment variables are validated against a strongly typed Zod schema before any other module or database connection initializes:

```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Operational Mode
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["local", "cloud"]).default("local"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),

  // Database Connection
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Authentication & Security
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters"),

  // Storage
  STORAGE_DRIVER: z.enum(["local", "database", "supabase"]).default("local"),
  LOCAL_STORAGE_PATH: z.string().default("./storage/resumes"),

  // Queue Configuration
  QUEUE_DRIVER: z.enum(["bullmq", "database"]).default("bullmq"),
  REDIS_URL: z.string().optional(),

  // AI Gateway Configuration
  AI_PROVIDER: z.enum(["ollama", "groq", "mock"]).default("ollama"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2:3b"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

---

## 2. Environment Profiles

### 2.1 Local Development Profile (`.env.local`) — Mode A
Optimized for completely offline, local Docker development at ₹0 cost:

```env
NODE_ENV=development
APP_MODE=local
PORT=4000
FRONTEND_URL=http://localhost:5173

# Local Docker PostgreSQL
DATABASE_URL="postgresql://techquery:techquery_secret@localhost:5432/techquery_dev?connection_limit=10"

# Security (Development Keys)
JWT_ACCESS_SECRET=dev_jwt_access_secret_must_be_32_characters_minimum
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_must_be_32_characters_minimum
COOKIE_SECRET=dev_cookie_signing_secret_32_characters_minimum

# Local Storage & Queue
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./storage/resumes
QUEUE_DRIVER=bullmq
REDIS_URL="redis://localhost:6379"

# AI Gateway (Local Ollama)
AI_PROVIDER=ollama
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:3b"
```

### 2.2 Cloud Showcase Profile (`.env.production`) — Mode B
Configured for free-tier cloud deployment (Render + Neon + Groq):

```env
NODE_ENV=production
APP_MODE=cloud
PORT=10000
FRONTEND_URL=https://techquery-ai.vercel.app

# Neon Serverless PostgreSQL (PgBouncer Pooled)
DATABASE_URL="postgresql://techquery_owner:password@ep-xyz-pooler.neon.tech/techquery_prod?sslmode=require&pgbouncer=true&connection_limit=5"

# Security (High-Entropy Production Secrets)
JWT_ACCESS_SECRET=prod_super_secure_access_secret_64_characters_random
JWT_REFRESH_SECRET=prod_super_secure_refresh_secret_64_characters_random
COOKIE_SECRET=prod_super_secure_cookie_secret_64_characters_random

# Storage & Queue (Zero-Cost Cloud Adaptations)
STORAGE_DRIVER=database
QUEUE_DRIVER=database

# AI Gateway (Groq Free Tier)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_free_tier_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### 2.3 Automated Testing Profile (`.env.test`)
Configured for deterministic Vitest and GitHub Actions execution:

```env
NODE_ENV=test
APP_MODE=local
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/techquery_test"
JWT_ACCESS_SECRET=test_jwt_access_secret_32_characters_minimum
JWT_REFRESH_SECRET=test_jwt_refresh_secret_32_characters_minimum
COOKIE_SECRET=test_cookie_secret_32_characters_minimum
STORAGE_DRIVER=local
QUEUE_DRIVER=database
AI_PROVIDER=mock
```

---

## 3. Secret Management & Leakage Prevention Rules

1. **Gitignore Protection:**
   - `.env`, `.env.*` (except `.env.example`), `storage/`, `dist/`, and `node_modules/` are strictly ignored in `.gitignore`.
2. **Template Maintenance:**
   - `.env.example` is committed to the repository with descriptive placeholder values and commentary. No actual secrets may be saved in `.env.example`.
3. **CI Secret Injection:**
   - Automated workflows inject secrets via GitHub Actions Repository Secrets, never via code changes.
