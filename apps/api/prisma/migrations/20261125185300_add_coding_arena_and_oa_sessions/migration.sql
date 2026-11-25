-- CreateEnum
CREATE TYPE "ProblemDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExecutionVerdict" AS ENUM ('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('UNTIMED', 'TIMED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "coding_problem_id" TEXT;

-- CreateTable
CREATE TABLE "coding_problems" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "difficulty" "ProblemDifficulty" NOT NULL,
    "pattern" VARCHAR(60) NOT NULL,
    "statement" TEXT NOT NULL,
    "constraints" JSONB NOT NULL DEFAULT '[]',
    "examples" JSONB NOT NULL DEFAULT '[]',
    "starter_code" JSONB NOT NULL,
    "sample_test_cases" JSONB NOT NULL DEFAULT '[]',
    "hidden_test_cases" JSONB NOT NULL DEFAULT '[]',
    "hints" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "mode" "SessionMode" NOT NULL DEFAULT 'TIMED',
    "difficulty_preset" VARCHAR(40) NOT NULL DEFAULT 'EASY_TO_MEDIUM',
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "duration_minutes" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "drafts_json" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_session_problems" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "max_points" INTEGER NOT NULL DEFAULT 100,
    "earned_points" INTEGER NOT NULL DEFAULT 0,
    "solved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "assessment_session_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "assessment_session_id" TEXT,
    "language" VARCHAR(30) NOT NULL,
    "code" TEXT NOT NULL,
    "verdict" "ExecutionVerdict" NOT NULL,
    "passed_count" INTEGER NOT NULL,
    "total_count" INTEGER NOT NULL,
    "runtime_ms" INTEGER NOT NULL,
    "memory_kb" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_problems_slug_key" ON "coding_problems"("slug");

-- CreateIndex
CREATE INDEX "coding_problems_user_id_idx" ON "coding_problems"("user_id");

-- CreateIndex
CREATE INDEX "coding_problems_difficulty_pattern_idx" ON "coding_problems"("difficulty", "pattern");

-- CreateIndex
CREATE INDEX "assessment_sessions_user_id_status_idx" ON "assessment_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "assessment_sessions_user_id_started_at_idx" ON "assessment_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "assessment_session_problems_session_id_idx" ON "assessment_session_problems"("session_id");

-- CreateIndex
CREATE INDEX "assessment_session_problems_problem_id_idx" ON "assessment_session_problems"("problem_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_session_problems_session_id_order_index_key" ON "assessment_session_problems"("session_id", "order_index");

-- CreateIndex
CREATE INDEX "coding_submissions_user_id_created_at_idx" ON "coding_submissions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "coding_submissions_problem_id_idx" ON "coding_submissions"("problem_id");

-- CreateIndex
CREATE INDEX "coding_submissions_assessment_session_id_idx" ON "coding_submissions"("assessment_session_id");

-- CreateIndex
CREATE INDEX "questions_coding_problem_id_idx" ON "questions"("coding_problem_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_coding_problem_id_fkey" FOREIGN KEY ("coding_problem_id") REFERENCES "coding_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_problems" ADD CONSTRAINT "coding_problems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_session_problems" ADD CONSTRAINT "assessment_session_problems_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_session_problems" ADD CONSTRAINT "assessment_session_problems_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "coding_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "coding_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_assessment_session_id_fkey" FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
