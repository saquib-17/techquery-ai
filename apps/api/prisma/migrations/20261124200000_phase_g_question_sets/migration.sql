-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('THEORETICAL', 'CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'PROJECT_DEFENSE');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT,
    "jd_id" TEXT,
    "match_id" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "topic_focus" VARCHAR(100) NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "provider_used" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question_set_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL,
    "targeted_skill" VARCHAR(100) NOT NULL,
    "interviewer_intent" TEXT NOT NULL,
    "key_evaluation_points" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_sets_user_id_created_at_idx" ON "question_sets"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "question_sets_resume_id_idx" ON "question_sets"("resume_id");

-- CreateIndex
CREATE INDEX "question_sets_jd_id_idx" ON "question_sets"("jd_id");

-- CreateIndex
CREATE INDEX "question_sets_match_id_idx" ON "question_sets"("match_id");

-- CreateIndex
CREATE INDEX "questions_question_set_id_idx" ON "questions"("question_set_id");

-- CreateIndex
CREATE INDEX "questions_targeted_skill_idx" ON "questions"("targeted_skill");

-- CreateIndex
CREATE INDEX "questions_category_idx" ON "questions"("category");

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_jd_id_fkey" FOREIGN KEY ("jd_id") REFERENCES "job_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "job_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
