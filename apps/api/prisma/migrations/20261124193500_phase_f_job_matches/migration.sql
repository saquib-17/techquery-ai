-- CreateTable
CREATE TABLE "job_matches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "jd_id" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "matched_skills" JSONB NOT NULL,
    "missing_skills" JSONB NOT NULL,
    "analysis_json" JSONB NOT NULL,
    "provider_used" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_matches_user_id_created_at_idx" ON "job_matches"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "job_matches_resume_id_idx" ON "job_matches"("resume_id");

-- CreateIndex
CREATE INDEX "job_matches_jd_id_idx" ON "job_matches"("jd_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_matches_resume_id_jd_id_key" ON "job_matches"("resume_id", "jd_id");

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_jd_id_fkey" FOREIGN KEY ("jd_id") REFERENCES "job_descriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant least-privilege DML permissions to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "job_matches" TO techquery_runtime;
