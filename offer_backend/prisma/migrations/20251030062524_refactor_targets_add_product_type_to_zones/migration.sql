/*
  Warnings:

  - You are about to drop the `ProductTypeTarget` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serviceZoneId,targetPeriod,periodType,productType]` on the table `ZoneTarget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductTypeTarget" DROP CONSTRAINT "ProductTypeTarget_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductTypeTarget" DROP CONSTRAINT "ProductTypeTarget_updatedById_fkey";

-- DropIndex
DROP INDEX "public"."ZoneTarget_serviceZoneId_targetPeriod_periodType_key";

-- AlterTable
ALTER TABLE "ZoneTarget" ADD COLUMN     "productType" "ProductType";

-- DropTable
DROP TABLE "public"."ProductTypeTarget";

-- CreateIndex
CREATE INDEX "ZoneTarget_productType_idx" ON "ZoneTarget"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneTarget_serviceZoneId_targetPeriod_periodType_productTyp_key" ON "ZoneTarget"("serviceZoneId", "targetPeriod", "periodType", "productType");
