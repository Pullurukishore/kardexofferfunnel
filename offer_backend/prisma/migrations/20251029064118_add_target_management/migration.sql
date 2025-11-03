-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "ZoneTarget" (
    "id" SERIAL NOT NULL,
    "serviceZoneId" INTEGER NOT NULL,
    "targetPeriod" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL DEFAULT 'MONTHLY',
    "targetValue" DECIMAL(12,2) NOT NULL,
    "targetOfferCount" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTarget" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetPeriod" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL DEFAULT 'MONTHLY',
    "targetValue" DECIMAL(12,2) NOT NULL,
    "targetOfferCount" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTypeTarget" (
    "id" SERIAL NOT NULL,
    "productType" "ProductType" NOT NULL,
    "targetPeriod" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL DEFAULT 'MONTHLY',
    "targetValue" DECIMAL(12,2) NOT NULL,
    "targetOfferCount" INTEGER,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTypeTarget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ZoneTarget_serviceZoneId_idx" ON "ZoneTarget"("serviceZoneId");

-- CreateIndex
CREATE INDEX "ZoneTarget_targetPeriod_idx" ON "ZoneTarget"("targetPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "ZoneTarget_serviceZoneId_targetPeriod_periodType_key" ON "ZoneTarget"("serviceZoneId", "targetPeriod", "periodType");

-- CreateIndex
CREATE INDEX "UserTarget_userId_idx" ON "UserTarget"("userId");

-- CreateIndex
CREATE INDEX "UserTarget_targetPeriod_idx" ON "UserTarget"("targetPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "UserTarget_userId_targetPeriod_periodType_key" ON "UserTarget"("userId", "targetPeriod", "periodType");

-- CreateIndex
CREATE INDEX "ProductTypeTarget_productType_idx" ON "ProductTypeTarget"("productType");

-- CreateIndex
CREATE INDEX "ProductTypeTarget_targetPeriod_idx" ON "ProductTypeTarget"("targetPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTypeTarget_productType_targetPeriod_periodType_key" ON "ProductTypeTarget"("productType", "targetPeriod", "periodType");

-- AddForeignKey
ALTER TABLE "ZoneTarget" ADD CONSTRAINT "ZoneTarget_serviceZoneId_fkey" FOREIGN KEY ("serviceZoneId") REFERENCES "ServiceZone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneTarget" ADD CONSTRAINT "ZoneTarget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneTarget" ADD CONSTRAINT "ZoneTarget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTarget" ADD CONSTRAINT "UserTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTarget" ADD CONSTRAINT "UserTarget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTarget" ADD CONSTRAINT "UserTarget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTypeTarget" ADD CONSTRAINT "ProductTypeTarget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTypeTarget" ADD CONSTRAINT "ProductTypeTarget_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
