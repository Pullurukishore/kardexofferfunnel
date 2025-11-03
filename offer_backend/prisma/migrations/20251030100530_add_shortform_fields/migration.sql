-- AlterTable
ALTER TABLE "ServiceZone" ADD COLUMN     "shortForm" VARCHAR(3) NOT NULL DEFAULT 'X';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shortForm" VARCHAR(5);
