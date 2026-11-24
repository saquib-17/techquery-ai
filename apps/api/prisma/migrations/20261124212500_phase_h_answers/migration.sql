-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "short_summary" TEXT NOT NULL,
    "detailed_explanation" TEXT NOT NULL,
    "code_snippet" TEXT,
    "time_complexity" VARCHAR(50),
    "space_complexity" VARCHAR(50),
    "common_mistakes" JSONB NOT NULL DEFAULT '[]',
    "style" VARCHAR(30) NOT NULL DEFAULT 'INTERVIEW',
    "provider_used" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "answers_question_id_key" ON "answers"("question_id");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
