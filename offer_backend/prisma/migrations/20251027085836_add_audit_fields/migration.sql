-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "offerId" INTEGER,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_offerId_idx" ON "AuditLog"("offerId");
