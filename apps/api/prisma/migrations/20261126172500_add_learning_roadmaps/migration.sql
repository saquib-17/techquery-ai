-- CreateTable
CREATE TABLE "learning_roadmaps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "target_role" VARCHAR(120) NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "daily_hours" DOUBLE PRECISION NOT NULL,
    "current_level" VARCHAR(20) NOT NULL,
    "phases" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_roadmaps_user_id_created_at_idx" ON "learning_roadmaps"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "learning_roadmaps" ADD CONSTRAINT "learning_roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
