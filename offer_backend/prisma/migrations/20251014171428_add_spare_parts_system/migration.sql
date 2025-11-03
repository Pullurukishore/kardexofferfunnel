-- CreateEnum
CREATE TYPE "SparePartStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- AlterEnum
ALTER TYPE "OfferStage" ADD VALUE 'INITIAL';

-- AlterEnum
ALTER TYPE "OfferStatus" ADD VALUE 'DRAFT';

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'SOFTWARE';

-- CreateTable
CREATE TABLE "SparePart" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "specifications" TEXT,
    "status" "SparePartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSparePart" (
    "id" SERIAL NOT NULL,
    "offerId" INTEGER NOT NULL,
    "sparePartId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferSparePart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_partNumber_key" ON "SparePart"("partNumber");

-- CreateIndex
CREATE INDEX "SparePart_partNumber_idx" ON "SparePart"("partNumber");

-- CreateIndex
CREATE INDEX "SparePart_category_idx" ON "SparePart"("category");

-- CreateIndex
CREATE INDEX "SparePart_status_idx" ON "SparePart"("status");

-- CreateIndex
CREATE INDEX "SparePart_name_idx" ON "SparePart"("name");

-- CreateIndex
CREATE INDEX "OfferSparePart_offerId_idx" ON "OfferSparePart"("offerId");

-- CreateIndex
CREATE INDEX "OfferSparePart_sparePartId_idx" ON "OfferSparePart"("sparePartId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferSparePart_offerId_sparePartId_key" ON "OfferSparePart"("offerId", "sparePartId");

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSparePart" ADD CONSTRAINT "OfferSparePart_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSparePart" ADD CONSTRAINT "OfferSparePart_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
