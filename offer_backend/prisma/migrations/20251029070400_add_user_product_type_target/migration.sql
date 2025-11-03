/*
  Warnings:

  - A unique constraint covering the columns `[userId,targetPeriod,periodType,productType]` on the table `UserTarget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."UserTarget_userId_targetPeriod_periodType_key";

-- AlterTable
ALTER TABLE "UserTarget" ADD COLUMN     "productType" "ProductType";

-- CreateIndex
CREATE INDEX "UserTarget_productType_idx" ON "UserTarget"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "UserTarget_userId_targetPeriod_periodType_productType_key" ON "UserTarget"("userId", "targetPeriod", "periodType", "productType");
