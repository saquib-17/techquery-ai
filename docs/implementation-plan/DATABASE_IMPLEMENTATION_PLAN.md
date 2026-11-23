# TechQuery AI — Database Implementation Plan

## Document Overview
This document specifies the database implementation architecture, Prisma schema workflow, migration management, indexing strategy, transaction patterns, and performance considerations for TechQuery AI. The platform utilizes **PostgreSQL 16** with **Prisma ORM**, fully optimized to operate within zero-cost limits on both local PostgreSQL and Neon Free Tier.

---

## 1. ORM & Migration Strategy

### Prisma Workflow
- **Schema Single Source of Truth:** `prisma/schema.prisma` defines models, relations, enums, and indexes.
- **Local Development Workflow:**
  1. Modify `prisma/schema.prisma`.
  2. Run `npx prisma migrate dev --name <descriptive_name>` to generate SQL migration and apply locally.
  3. Run `npx prisma generate` to refresh the strongly typed `@prisma/client`.
- **CI/CD & Cloud Deployment Workflow:**
  1. Never run `migrate dev` in production or cloud showcases.
  2. Run `npx prisma migrate deploy` which executes pending migrations against the target database without resetting data.
- **Migration Drift Prevention:**
  - Database schema changes MUST NOT be applied manually via SQL clients (e.g., pgAdmin, DBeaver). All changes must pass through version-controlled Prisma migration files in `prisma/migrations/`.

---

## 2. Connection Management & Free-Tier Guardrails

### Connection Pooling Strategy
- **Neon Free-Tier Constraint:** Maximum 20 simultaneous active connections.
- **Local Mode A:** Direct connection pool to PostgreSQL container:
  `DATABASE_URL="postgresql://techquery:techquery_secret@localhost:5432/techquery_dev?connection_limit=10"`
- **Cloud Mode B (Neon):** Must use pooled connection string (`-pooler` endpoint via PgBouncer) to prevent connection starvation during traffic spikes:
  `DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.neon.tech/techquery_prod?sslmode=require&pgbouncer=true&connection_limit=5"`
- **Prisma Client Lifecycle:**
  - The `PrismaClient` instance is instantiated as a singleton in `src/core/database/prisma.ts`.
  - In serverless or containerized environments, the client is cached on the global object during development to prevent multiple pool allocations during hot reloads.
  - Proper disconnect handler registered on `SIGTERM` and `SIGINT`.

---

## 3. Core Database Models & Relations

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum ExperienceLevel {
  ENTRY_LEVEL
  JUNIOR
  MID_LEVEL
  SENIOR
  LEAD
}

enum AnalysisStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum QuestionCategory {
  TECHNICAL
  SYSTEM_DESIGN
  BEHAVIORAL
  SITUATIONAL
}

enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  role         Role      @default(USER)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  profile         Profile?
  resumes         Resume[]
  jobDescriptions JobDescription[]
  analyses        Analysis[]
  collections     QuestionCollection[]
  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String   @unique @map("token_hash")
  userId    String   @map("user_id")
  revoked   Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model Profile {
  id              String          @id @default(uuid())
  userId          String          @unique @map("user_id")
  fullName        String          @map("full_name")
  targetRole      String          @map("target_role")
  experienceLevel ExperienceLevel @map("experience_level")
  targetCompanies String[]        @map("target_companies")
  declaredSkills  String[]        @map("declared_skills")
  isOnboarded     Boolean         @default(false) @map("is_onboarded")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Resume {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  fileName       String   @map("file_name")
  fileSize       Int      @map("file_size")
  fileMimeType   String   @map("file_mime_type")
  storagePath    String?  @map("storage_path")
  fileData       Bytes?   @map("file_data") // Used in Mode B when local storage unavailable
  rawText        String   @map("raw_text") @db.Text
  parsedData     Json?    @map("parsed_data")
  parsingStatus  AnalysisStatus @default(PENDING) @map("parsing_status")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  analyses Analysis[]

  @@index([userId, createdAt])
  @@map("resumes")
}

model JobDescription {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  title           String
  companyName     String?  @map("company_name")
  rawText         String   @map("raw_text") @db.Text
  requiredSkills  String[] @map("required_skills")
  preferredSkills String[] @map("preferred_skills")
  experienceReq   String?  @map("experience_req")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  analyses Analysis[]

  @@index([userId, createdAt])
  @@map("job_descriptions")
}

model Analysis {
  id               String         @id @default(uuid())
  userId           String         @map("user_id")
  resumeId         String         @map("resume_id")
  jobDescriptionId String         @map("job_description_id")
  overallScore     Float          @map("overall_score")
  matchedSkills    String[]       @map("matched_skills")
  missingSkills    String[]       @map("missing_skills")
  additionalSkills String[]       @map("additional_skills")
  executiveSummary String         @map("executive_summary") @db.Text
  breakdown        Json           // { skillScore, experienceScore, domainScore }
  status           AnalysisStatus @default(COMPLETED)
  createdAt        DateTime       @default(now()) @map("created_at")

  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  resume         Resume           @relation(fields: [resumeId], references: [id], onDelete: Cascade)
  jobDescription JobDescription   @relation(fields: [jobDescriptionId], references: [id], onDelete: Cascade)
  questions      Question[]

  @@index([userId, createdAt])
  @@map("analyses")
}

model Question {
  id           String             @id @default(uuid())
  analysisId   String             @map("analysis_id")
  category     QuestionCategory
  difficulty   QuestionDifficulty
  prompt       String             @db.Text
  rationale    String             @db.Text
  modelAnswer  String?            @map("model_answer") @db.Text
  starGuide    Json?              @map("star_guide") // { situation, task, action, result }
  userNotes    String?            @map("user_notes") @db.Text
  createdAt    DateTime           @default(now()) @map("created_at")

  analysis        Analysis         @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  collectionItems CollectionItem[]

  @@index([analysisId])
  @@map("questions")
}

model QuestionCollection {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CollectionItem[]

  @@index([userId])
  @@map("question_collections")
}

model CollectionItem {
  id           String   @id @default(uuid())
  collectionId String   @map("collection_id")
  questionId   String   @map("question_id")
  addedAt      DateTime @default(now()) @map("added_at")

  collection QuestionCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  question   Question           @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([collectionId, questionId])
  @@map("collection_items")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  action    String
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@map("audit_logs")
}

model JobQueue {
  id        String    @id @default(uuid())
  queueName String    @map("queue_name")
  payload   Json
  status    String    @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED
  attempts  Int       @default(0)
  lockedAt  DateTime? @map("locked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@index([queueName, status, createdAt])
  @@map("job_queue")
}
```

---

## 4. Indexing & Query Optimization Strategy

1. **Foreign Key Indexing:**
   - Every foreign key field (`userId`, `resumeId`, `jobDescriptionId`, `analysisId`, `collectionId`) has an explicit index to eliminate table scans during relation joins.
2. **Composite Indexes for Dashboard & History:**
   - `@@index([userId, createdAt])` placed on `resumes`, `job_descriptions`, and `analyses`. Enables rapid paginated retrieval of candidate activity without sorting overhead.
3. **Queue Polling Index:**
   - `@@index([queueName, status, createdAt])` on `job_queue` allows the cloud worker to fetch pending tasks in `O(1)` index time via `SELECT ... FOR UPDATE SKIP LOCKED`.

---

## 5. Transaction Patterns

Multi-step database updates MUST be wrapped in `prisma.$transaction`:

- **Collection Item Addition:** Verifying question ownership, adding to collection, and updating collection timestamp in a single atomic transaction.
- **Refresh Token Rotation:** Invalidating old token and inserting new token atomically to prevent race conditions during parallel requests:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.refreshToken.update({
    where: { id: oldTokenId },
    data: { revoked: true },
  });
  await tx.refreshToken.create({
    data: { userId, tokenHash: newTokenHash, expiresAt: newExpiry },
  });
});
```

---

## 6. Seeding Strategy

The seed script (`prisma/seeds/seed.ts`) executes idempotently (`upsert`):
1. **Skill Taxonomy:** Seeds 150+ canonical engineering skills across 7 categories (Languages, Frontend, Backend, Databases, Cloud/DevOps, AI/ML, Testing).
2. **Demo User Accounts:**
   - `demo@techquery.local` (preloaded with a sample Software Engineer profile, parsed resume, and mock analysis for immediate MCA placement presentation without manual setup).
