-- CreateTable
CREATE TABLE "StageRemark" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "stage" "OfferStage" NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageRemark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageRemark_offerId_idx" ON "StageRemark"("offerId");

-- CreateIndex
CREATE INDEX "StageRemark_stage_idx" ON "StageRemark"("stage");

-- CreateIndex
CREATE INDEX "StageRemark_createdAt_idx" ON "StageRemark"("createdAt");

-- AddForeignKey
ALTER TABLE "StageRemark" ADD CONSTRAINT "StageRemark_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageRemark" ADD CONSTRAINT "StageRemark_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
