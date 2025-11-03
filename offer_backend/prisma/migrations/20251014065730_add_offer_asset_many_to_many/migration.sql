/*
  Warnings:

  - You are about to drop the column `assetId` on the `Offer` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Offer" DROP CONSTRAINT "Offer_assetId_fkey";

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "assetId";

-- CreateTable
CREATE TABLE "OfferAsset" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferAsset_offerId_idx" ON "OfferAsset"("offerId");

-- CreateIndex
CREATE INDEX "OfferAsset_assetId_idx" ON "OfferAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferAsset_offerId_assetId_key" ON "OfferAsset"("offerId", "assetId");

-- AddForeignKey
ALTER TABLE "OfferAsset" ADD CONSTRAINT "OfferAsset_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferAsset" ADD CONSTRAINT "OfferAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
