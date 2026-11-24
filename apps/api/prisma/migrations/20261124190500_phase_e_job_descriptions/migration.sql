-- CreateTable
CREATE TABLE "job_descriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "company" VARCHAR(150),
    "raw_text" TEXT NOT NULL,
    "structured_json" JSONB NOT NULL,
    "provider_used" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_descriptions_user_id_created_at_idx" ON "job_descriptions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grant least-privilege DML permissions to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "job_descriptions" TO techquery_runtime;
