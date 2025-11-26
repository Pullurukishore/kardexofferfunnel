-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'BD_CHARGES';
ALTER TYPE "ProductType" ADD VALUE 'BD_SPARE';
ALTER TYPE "ProductType" ADD VALUE 'MIDLIFE_UPGRADE';
ALTER TYPE "ProductType" ADD VALUE 'RETROFIT_KIT';
