/*
  Warnings:

  - The `productType` column on the `Offer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lead` column on the `Offer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('RELOCATION', 'CONTRACT', 'SPP', 'UPGRADE_KIT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('YES', 'NO');

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "productType",
ADD COLUMN     "productType" "ProductType",
DROP COLUMN "lead",
ADD COLUMN     "lead" "LeadStatus";
