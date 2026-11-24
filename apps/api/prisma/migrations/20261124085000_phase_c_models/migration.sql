-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('UPLOADED', 'PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "location" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "current_role" TEXT,
    "years_of_experience" INTEGER,
    "highest_education" TEXT,
    "university" TEXT,
    "graduation_year" INTEGER,
    "linkedin_url" TEXT,
    "github_url" TEXT,
    "portfolio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" TEXT NOT NULL DEFAULT 'PROFILE',
    "onboarding_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "stored_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_extension" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "extracted_text" TEXT,
    "processing_status" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_states_user_id_key" ON "onboarding_states"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_stored_file_name_key" ON "resumes"("stored_file_name");

-- CreateIndex
CREATE INDEX "resumes_user_id_idx" ON "resumes"("user_id");

-- CreateIndex
CREATE INDEX "resumes_user_id_is_primary_idx" ON "resumes"("user_id", "is_primary");

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant least-privilege DML permissions to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "candidate_profiles" TO techquery_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "onboarding_states" TO techquery_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "resumes" TO techquery_runtime;
