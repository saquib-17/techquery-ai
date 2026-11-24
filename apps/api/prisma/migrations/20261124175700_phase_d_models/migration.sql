-- AlterTable
ALTER TABLE "resumes" ADD COLUMN "parsed_data" JSONB;

-- CreateTable
CREATE TABLE "resume_analyses" (
    "id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "ats_score" INTEGER NOT NULL,
    "section_scores" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "provider_used" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resume_analyses_resume_id_key" ON "resume_analyses"("resume_id");

-- AddForeignKey
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant least-privilege DML permissions to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "resume_analyses" TO techquery_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "resumes" TO techquery_runtime;
