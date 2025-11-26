-- CreateIndex
CREATE INDEX "Offer_zoneId_stage_idx" ON "Offer"("zoneId", "stage");

-- CreateIndex
CREATE INDEX "Offer_createdById_createdAt_idx" ON "Offer"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "Offer_customerId_stage_idx" ON "Offer"("customerId", "stage");
