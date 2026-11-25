-- CreateEnum
CREATE TYPE "DsaSheetStatus" AS ENUM ('UNSOLVED', 'SOLVED', 'REVISION');

-- CreateTable
CREATE TABLE "user_dsa_sheet_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "problem_slug" VARCHAR(180) NOT NULL,
    "status" "DsaSheetStatus" NOT NULL DEFAULT 'UNSOLVED',
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dsa_sheet_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_dsa_sheet_progress_user_id_status_idx" ON "user_dsa_sheet_progress"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_dsa_sheet_progress_user_id_problem_slug_key" ON "user_dsa_sheet_progress"("user_id", "problem_slug");

-- AddForeignKey
ALTER TABLE "user_dsa_sheet_progress" ADD CONSTRAINT "user_dsa_sheet_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
