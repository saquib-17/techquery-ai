-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('RESUME_UPLOADED', 'JD_ANALYZED', 'MATCH_EVALUATED', 'QUESTIONS_GENERATED', 'ANSWER_GENERATED', 'COLLECTION_CREATED', 'PDF_EXPORTED', 'TIER_CHANGED');

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "activity_date" DATE NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_user_id_activity_date_idx" ON "user_activities"("user_id", "activity_date" DESC);

-- CreateIndex
CREATE INDEX "user_activities_user_id_created_at_idx" ON "user_activities"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
