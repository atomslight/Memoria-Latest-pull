-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "photos_user_id_deleted_at_idx" ON "photos"("user_id", "deleted_at");
