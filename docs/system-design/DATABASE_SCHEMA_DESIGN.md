# TechQuery AI — Relational Database Schema Specification

**Document ID:** TQ-ARCH-004  
**Version:** 1.0.0 (System Design Phase)  
**Author:** Principal Database Architect & Systems Engineering Group  
**Status:** Approved for Implementation Planning  
**Engine:** PostgreSQL 16+ via Prisma ORM  

---

## 1. Schema Design Philosophy

This document defines the complete relational schema design for **TechQuery AI**.
- **Engine:** PostgreSQL 16+.
- **Identifiers:** Primary keys use UUIDv4 strings.
- **Enums:** Explicit database enums for deterministic state machines.
- **Timestamps:** ISO 8601 UTC timestamps with timezone (`timestamptz`).
- **Audit Columns:** `created_at` and `updated_at` on all mutable tables.

---

## 2. PostgreSQL Enumerated Types

```sql
CREATE TYPE role_enum AS ENUM ('CANDIDATE', 'ADMIN');
CREATE TYPE user_tier_enum AS ENUM ('FREE', 'PRO');
CREATE TYPE resume_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE question_category_enum AS ENUM ('THEORETICAL', 'CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'PROJECT_DEFENSE');
CREATE TYPE question_difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE job_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE activity_type_enum AS ENUM ('RESUME_UPLOADED', 'JD_ANALYZED', 'QUESTIONS_GENERATED', 'ANSWER_VIEWED', 'PDF_EXPORTED', 'COLLECTION_CREATED');
```

---

## 3. Relational Table Specifications

### 3.1 Table: `users`
Anchor table for authentication and account identity.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `email` | `VARCHAR(255)` | NOT NULL | UNIQUE, Index |
| `password_hash`| `VARCHAR(255)` | NULLABLE | Nullable for pure OAuth sign-ins |
| `name` | `VARCHAR(150)` | NOT NULL | Full user name |
| `role` | `role_enum` | NOT NULL | Default: `'CANDIDATE'` |
| `tier` | `user_tier_enum` | NOT NULL | Default: `'FREE'` |
| `is_verified` | `BOOLEAN` | NOT NULL | Default: `FALSE` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

### 3.2 Table: `user_profiles`
Stores progressive onboarding and candidate preferences (1-to-1 with `users`).

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` | NOT NULL | UNIQUE, FK ➔ `users(id)` ON DELETE CASCADE |
| `education_level`| `VARCHAR(100)`| NULLABLE | e.g., "B.Tech Computer Science", "MCA" |
| `experience_band`| `VARCHAR(50)` | NULLABLE | e.g., "STUDENT", "FRESHER", "1_TO_3_YEARS" |
| `target_role` | `VARCHAR(100)`| NULLABLE | e.g., "Full Stack Developer", "Backend SDE-1" |
| `target_companies`| `TEXT[]` | NOT NULL | Default: `'{}'`, array of company names |
| `primary_languages`| `TEXT[]` | NOT NULL | Default: `'{}'`, array of preferred stacks |
| `onboarding_completed`| `BOOLEAN` | NOT NULL | Default: `FALSE` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

### 3.3 Table: `refresh_tokens`
Manages secure session tokens with family-based reuse detection.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` | NOT NULL | FK ➔ `users(id)` ON DELETE CASCADE, Index |
| `token_hash` | `VARCHAR(255)` | NOT NULL | UNIQUE, SHA-256 hash of refresh token |
| `family_id` | `VARCHAR(100)` | NOT NULL | Index; tracks token rotation ancestry |
| `is_revoked` | `BOOLEAN` | NOT NULL | Default: `FALSE` |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Session expiry timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

### 3.4 Table: `resumes`
Stores resume document metadata, storage paths, and structured JSON graphs.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` | NOT NULL | FK ➔ `users(id)` ON DELETE CASCADE, Index |
| `original_filename`| `VARCHAR(255)` | NOT NULL | Original user file name |
| `file_url` | `VARCHAR(500)` | NOT NULL | Relative disk path or Supabase public URL |
| `file_buffer` | `BYTEA` | NULLABLE | Optional binary storage for zero-cloud-storage setups |
| `mime_type` | `VARCHAR(100)` | NOT NULL | `application/pdf` or `application/vnd.openxml...` |
| `file_size_bytes` | `INTEGER` | NOT NULL | Size in bytes (max 5MB enforced) |
| `raw_text` | `TEXT` | NULLABLE | Extracted plain text |
| `parsed_json` | `JSONB` | NULLABLE | Structured extraction (Skills, Work, Projects, Edu) |
| `status` | `resume_status_enum` | NOT NULL | Default: `'PENDING'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

### 3.5 Table: `resume_analyses`
Stores ATS health score, impact metrics, section breakdowns, and Google X-Y-Z bullet rewrites.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `resume_id` | `UUID` / `TEXT` | NOT NULL | UNIQUE, FK ➔ `resumes(id)` ON DELETE CASCADE |
| `ats_score` | `INTEGER` | NOT NULL | Calculated score (0–100) |
| `section_scores` | `JSONB` | NOT NULL | Category scores (`contact`, `summary`, `experience`, `skills`, `education`) |
| `strengths` | `JSONB` | NOT NULL | Default: `'[]'`, list of strong areas |
| `issues` | `JSONB` | NOT NULL | Default: `'[]'`, list of detected flaws |
| `improvements` | `JSONB` | NOT NULL | Default: `'[]'`, Google X-Y-Z rewrites |
| `provider_used`| `VARCHAR(50)` | NOT NULL | AI Provider (`OLLAMA`, `GROQ`, `MOCK`, `FALLBACK`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

### 3.6 Table: `job_descriptions`
Stores ingested target job postings and decomposed competencies.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` / `TEXT` | NOT NULL | FK ➔ `users(id)` ON DELETE CASCADE, Index |
| `title` | `VARCHAR(150)` | NOT NULL | Role title (e.g. "Software Engineer") |
| `company` | `VARCHAR(150)` | NULLABLE | Target employer |
| `raw_text` | `TEXT` | NOT NULL | Full raw job description text (min 100 chars) |
| `structured_json`| `JSONB` | NOT NULL | Extracted role, seniority, experienceYears, mustHaveSkills, niceToHaveSkills, responsibilities, techStackCategories |
| `provider_used`| `VARCHAR(50)` | NOT NULL | AI Provider (`OLLAMA`, `GROQ`, `MOCK`, `FALLBACK`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

*Index:* `@@index([user_id, created_at])`

---

### 3.7 Table: `job_matches`
Junction table storing deterministic weighted score + AI hybrid qualitative match results.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` / `TEXT` | NOT NULL | FK ➔ `users(id)` ON DELETE CASCADE, Index |
| `resume_id` | `UUID` / `TEXT` | NOT NULL | FK ➔ `resumes(id)` ON DELETE CASCADE, Index |
| `jd_id` | `UUID` / `TEXT` | NOT NULL | FK ➔ `job_descriptions(id)` ON DELETE CASCADE, Index |
| `match_score` | `INTEGER` | NOT NULL | 0–100 deterministic weighted match score |
| `score_breakdown` | `JSONB` | NOT NULL | Must-have (50%), Nice-to-have (20%), Experience (20%), Domain (10%) |
| `matched_skills` | `JSONB` | NOT NULL | Array of overlapping skill names (case-preserved) |
| `missing_skills` | `JSONB` | NOT NULL | Array of `{ skill, importance: "HIGH"|"MEDIUM"|"LOW", category }` |
| `analysis_json` | `JSONB` | NOT NULL | Qualitative narrative: experienceMatch, projectRelevance, strengths, weaknesses, recommendations |
| `provider_used` | `VARCHAR(50)` | NOT NULL | AI Provider (`OLLAMA`, `GROQ`, `MOCK`, `FALLBACK`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

*Unique Constraint:* `UNIQUE(resume_id, jd_id)` to prevent duplicate match records.  
*Indexes:* `@@index([user_id, created_at])`, `@@index([resume_id])`, `@@index([jd_id])`.

---

### 3.8 Table: `skills` & `candidate_skills`
Canonical skill taxonomy dictionary and candidate resume associations.

```sql
-- Table: skills
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL -- 'LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'CONCEPT'
);

-- Table: candidate_skills
CREATE TABLE candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency VARCHAR(50) DEFAULT 'PRACTICAL',
    UNIQUE(resume_id, skill_id)
);
```

---

### 3.9 Table: `question_sets` & `questions`
Core interview preparation question tables.

```sql
-- Table: question_sets
CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    jd_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
    match_id UUID REFERENCES job_matches(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    topic_focus VARCHAR(100) NOT NULL,
    difficulty question_difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    total_count INTEGER NOT NULL DEFAULT 0,
    provider_used VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    category question_category_enum NOT NULL,
    difficulty question_difficulty_enum NOT NULL,
    targeted_skill VARCHAR(100) NOT NULL,
    interviewer_intent TEXT NOT NULL,
    key_evaluation_points JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX question_sets_user_id_created_at_idx ON question_sets(user_id, created_at);
CREATE INDEX question_sets_resume_id_idx ON question_sets(resume_id);
CREATE INDEX question_sets_jd_id_idx ON question_sets(jd_id);
CREATE INDEX question_sets_match_id_idx ON question_sets(match_id);
CREATE INDEX questions_question_set_id_idx ON questions(question_set_id);
CREATE INDEX questions_targeted_skill_idx ON questions(targeted_skill);
CREATE INDEX questions_category_idx ON questions(category);
```

---

### 3.10 Table: `answers`
Stores model answers and complexity metrics (1-to-1 with `questions`).

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `TEXT` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `question_id` | `UUID` / `TEXT` | NOT NULL | UNIQUE, FK ➔ `questions(id)` ON DELETE CASCADE |
| `short_summary` | `TEXT` | NOT NULL | 2–3 sentence executive summary |
| `detailed_explanation`| `TEXT`| NOT NULL | Comprehensive technical deep dive (or STAR structure) |
| `code_snippet` | `TEXT` | NULLABLE | Implementation code or query snippet (null for behavioral) |
| `time_complexity` | `VARCHAR(50)` | NULLABLE | e.g. "O(log N)" or "O(N)" (null for behavioral) |
| `space_complexity`| `VARCHAR(50)` | NULLABLE | e.g. "O(1)" or "O(N)" (null for behavioral) |
| `common_mistakes` | `JSONB` | NOT NULL | Default: `'[]'`, anti-patterns/pitfalls to avoid |
| `style` | `VARCHAR(30)` | NOT NULL | Default: `'INTERVIEW'` (`CONCISE`, `DETAILED`, `INTERVIEW`) |
| `provider_used`| `VARCHAR(50)` | NOT NULL | AI Provider (`OLLAMA`, `GROQ`, `MOCK`, `FALLBACK`) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

*Unique Constraint:* `UNIQUE(question_id)`.  
*Cascade Rule:* `ON DELETE CASCADE` via `questions(id)`.

---

### 3.11 Table: `saved_collections` & `collection_items`
User-curated question folders and PDF export baskets.

```sql
-- Table: saved_collections
CREATE TABLE saved_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_collections_user_created ON saved_collections(user_id, created_at DESC);

-- Table: collection_items
CREATE TABLE collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES saved_collections(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(collection_id, question_id)
);
```

---

### 3.12 Table: `user_activities`
Granular user event log driving the preparation streak engine.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` | NOT NULL | FK ➔ `users(id)` ON DELETE CASCADE, Index |
| `activity_type` | `activity_type_enum`| NOT NULL | Categorized event type |
| `activity_date` | `DATE` | NOT NULL | Local prep date (e.g., '2026-11-21') |
| `metadata` | `JSONB` | NOT NULL | Default: `'{}'`, additional context |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

*Index:* `CREATE INDEX idx_user_activity_date ON user_activities(user_id, activity_date DESC);`

---

### 3.13 Table: `job_queue`
PostgreSQL-backed asynchronous job queue powering reliable processing in Cloud Mode.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `queue_name` | `VARCHAR(50)` | NOT NULL | e.g., 'RESUME_PARSE', 'QGEN' |
| `job_type` | `VARCHAR(100)` | NOT NULL | Specific worker handler name |
| `payload` | `JSONB` | NOT NULL | Input arguments for worker |
| `status` | `job_status_enum` | NOT NULL | Default: `'PENDING'` |
| `attempts` | `INTEGER` | NOT NULL | Default: 0 |
| `max_attempts` | `INTEGER` | NOT NULL | Default: 3 |
| `error_message` | `TEXT` | NULLABLE | Logged failure details |
| `run_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()`, scheduled execution time |
| `locked_at` | `TIMESTAMPTZ` | NULLABLE | Timestamp when picked up by worker |
| `locked_by` | `VARCHAR(100)` | NULLABLE | Worker process identifier |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

*Index:* `CREATE INDEX idx_job_queue_fetch ON job_queue(status, run_at) WHERE status = 'PENDING';`

---

### 3.14 Table: `ai_inference_logs`
System observability log tracking token efficiency, latency, and provider fallback events.

| Column Name | PostgreSQL Data Type | Modifiers | Constraints & Descriptions |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NOT NULL | PRIMARY KEY, Default: `gen_random_uuid()` |
| `user_id` | `UUID` | NULLABLE | FK ➔ `users(id)` ON DELETE SET NULL, Index |
| `task_type` | `VARCHAR(50)` | NOT NULL | e.g. 'QGEN', 'AGEN', 'RESUME_PARSE' |
| `provider` | `VARCHAR(50)` | NOT NULL | e.g. 'OLLAMA', 'GROQ', 'GEMINI' |
| `model_name` | `VARCHAR(100)` | NOT NULL | e.g. 'llama-3.1-8b-instant' |
| `input_tokens` | `INTEGER` | NOT NULL | Count of prompt tokens |
| `output_tokens`| `INTEGER` | NOT NULL | Count of generated tokens |
| `latency_ms` | `INTEGER` | NOT NULL | Wall-clock execution time in milliseconds |
| `success` | `BOOLEAN` | NOT NULL | Schema validation success flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Default: `NOW()` |

---

## 4. Example Prisma Schema Definition (Design Specification)

```prisma
// Example Schema Specification for Phase 2 Architectural Documentation
// Note: This specification is for design verification only.

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CANDIDATE
  ADMIN
}

enum UserTier {
  FREE
  PRO
}

enum ResumeStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum QuestionCategory {
  THEORETICAL
  CODING
  SYSTEM_DESIGN
  BEHAVIORAL
  PROJECT_DEFENSE
}

enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
}

model User {
  id            String         @id @default(uuid()) @db.Uuid
  email         String         @unique @db.VarChar(255)
  passwordHash  String?        @map("password_hash") @db.VarChar(255)
  name          String         @db.VarChar(150)
  role          Role           @default(CANDIDATE)
  tier          UserTier       @default(FREE)
  isVerified    Boolean        @default(false) @map("is_verified")
  createdAt     DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime       @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  profile       UserProfile?
  refreshTokens RefreshToken[]
  resumes       Resume[]
  jobDescriptions JobDescription[]
  questionSets  QuestionSet[]
  collections   SavedCollection[]
  activities    UserActivity[]
  inferenceLogs AIInferenceLog[]

  @@map("users")
}

model UserProfile {
  id                 String   @id @default(uuid()) @db.Uuid
  userId             String   @unique @map("user_id") @db.Uuid
  educationLevel     String?  @map("education_level") @db.VarChar(100)
  experienceBand     String?  @map("experience_band") @db.VarChar(50)
  targetRole         String?  @map("target_role") @db.VarChar(100)
  targetCompanies    String[] @default([]) @map("target_companies")
  primaryLanguages   String[] @default([]) @map("primary_languages")
  onboardingCompleted Boolean  @default(false) @map("onboarding_completed")
  updatedAt          DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Resume {
  id               String       @id @default(uuid()) @db.Uuid
  userId           String       @map("user_id") @db.Uuid
  originalFilename String       @map("original_filename") @db.VarChar(255)
  fileUrl          String       @map("file_url") @db.VarChar(500)
  fileBuffer       Bytes?       @map("file_buffer")
  mimeType         String       @map("mime_type") @db.VarChar(100)
  fileSizeBytes    Int          @map("file_size_bytes")
  rawText          String?      @map("raw_text") @db.Text
  parsedJson       Json?        @map("parsed_json")
  status           ResumeStatus @default(PENDING)
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  analysis        ResumeAnalysis?
  candidateSkills CandidateSkill[]
  matches         JobMatch[]
  questionSets    QuestionSet[]

  @@index([userId])
  @@map("resumes")
}

model QuestionSet {
  id          String             @id @default(uuid()) @db.Uuid
  userId      String             @map("user_id") @db.Uuid
  resumeId    String?            @map("resume_id") @db.Uuid
  jdId        String?            @map("jd_id") @db.Uuid
  title       String             @db.VarChar(200)
  topicFocus  String             @map("topic_focus") @db.VarChar(100)
  difficulty  QuestionDifficulty
  createdAt   DateTime           @default(now()) @map("created_at") @db.Timestamptz

  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  resume    Resume?         @relation(fields: [resumeId], references: [id], onDelete: SetNull)
  questions Question[]

  @@index([userId])
  @@map("question_sets")
}

model Question {
  id                 String           @id @default(uuid()) @db.Uuid
  questionSetId      String           @map("question_set_id") @db.Uuid
  questionText       String           @map("question_text") @db.Text
  category           QuestionCategory
  difficulty         QuestionDifficulty
  targetedSkill      String           @map("targeted_skill") @db.VarChar(100)
  interviewerIntent  String           @map("interviewer_intent") @db.Text
  keyEvaluationPoints Json            @default("[]") @map("key_evaluation_points")
  createdAt          DateTime         @default(now()) @map("created_at") @db.Timestamptz

  questionSet     QuestionSet      @relation(fields: [questionSetId], references: [id], onDelete: Cascade)
  answer          Answer?
  collectionItems CollectionItem[]

  @@index([questionSetId])
  @@map("questions")
}

model Answer {
  id                  String   @id @default(uuid()) @db.Uuid
  questionId          String   @unique @map("question_id") @db.Uuid
  shortSummary        String   @map("short_summary") @db.Text
  detailedExplanation String   @map("detailed_explanation") @db.Text
  codeSnippet         String?  @map("code_snippet") @db.Text
  timeComplexity      String?  @map("time_complexity") @db.VarChar(50)
  spaceComplexity     String?  @map("space_complexity") @db.VarChar(50)
  commonMistakes      Json     @default("[]") @map("common_mistakes")
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@map("answers")
}

model UserActivity {
  id           String       @id @default(uuid()) @db.Uuid
  userId       String       @map("user_id") @db.Uuid
  activityType ActivityType @map("activity_type")
  activityDate DateTime     @map("activity_date") @db.Date
  metadata     Json         @default("{}")
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, activityDate(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@map("user_activities")
}
```
