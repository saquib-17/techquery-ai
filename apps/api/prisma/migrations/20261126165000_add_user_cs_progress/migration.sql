-- CreateEnum
CREATE TYPE "CsTopicStatus" AS ENUM ('UNSTUDIED', 'LEARNED', 'REVISION');

-- CreateTable
CREATE TABLE "user_cs_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_slug" VARCHAR(180) NOT NULL,
    "status" "CsTopicStatus" NOT NULL DEFAULT 'UNSTUDIED',
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cs_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_cs_progress_user_id_status_idx" ON "user_cs_progress"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_cs_progress_user_id_topic_slug_key" ON "user_cs_progress"("user_id", "topic_slug");

-- AddForeignKey
ALTER TABLE "user_cs_progress" ADD CONSTRAINT "user_cs_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
