/*
  Warnings:

  - The values [INITIAL_CONTACT,REQUIREMENT_GATHERING,DEMO_SCHEDULED,DEMO_COMPLETED,CONTRACT_SENT] on the enum `OfferStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OfferStage_new" AS ENUM ('INITIAL', 'PROPOSAL_SENT', 'NEGOTIATION', 'FINAL_APPROVAL', 'PO_RECEIVED', 'ORDER_BOOKED', 'WON', 'LOST');
ALTER TABLE "public"."Offer" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Offer" ALTER COLUMN "stage" TYPE "OfferStage_new" USING ("stage"::text::"OfferStage_new");
ALTER TYPE "OfferStage" RENAME TO "OfferStage_old";
ALTER TYPE "OfferStage_new" RENAME TO "OfferStage";
DROP TYPE "public"."OfferStage_old";
ALTER TABLE "Offer" ALTER COLUMN "stage" SET DEFAULT 'INITIAL';
COMMIT;

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "stage" SET DEFAULT 'INITIAL';
