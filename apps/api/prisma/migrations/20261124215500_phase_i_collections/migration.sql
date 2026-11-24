-- CreateTable
CREATE TABLE "saved_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_collections_user_id_created_at_idx" ON "saved_collections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "collection_items_collection_id_idx" ON "collection_items"("collection_id");

-- CreateIndex
CREATE INDEX "collection_items_question_id_idx" ON "collection_items"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collection_id_question_id_key" ON "collection_items"("collection_id", "question_id");

-- AddForeignKey
ALTER TABLE "saved_collections" ADD CONSTRAINT "saved_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "saved_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
