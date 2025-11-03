-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('MEMBER', 'VISITOR');

-- CreateTable
CREATE TABLE "communion_services" (
    "id" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "membersCount" INTEGER NOT NULL DEFAULT 0,
    "visitorsCount" INTEGER NOT NULL DEFAULT 0,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communion_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communion_records" (
    "id" TEXT NOT NULL,
    "communionServiceId" TEXT NOT NULL,
    "memberId" TEXT,
    "visitorName" TEXT,
    "visitorChurch" TEXT,
    "visitorPhone" TEXT,
    "visitorEmail" TEXT,
    "participantType" "ParticipantType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communion_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communion_services_serviceDate_idx" ON "communion_services"("serviceDate");

-- CreateIndex
CREATE INDEX "communion_services_year_quarter_idx" ON "communion_services"("year", "quarter");

-- CreateIndex
CREATE INDEX "communion_records_communionServiceId_idx" ON "communion_records"("communionServiceId");

-- CreateIndex
CREATE INDEX "communion_records_memberId_idx" ON "communion_records"("memberId");

-- AddForeignKey
ALTER TABLE "communion_records" ADD CONSTRAINT "communion_records_communionServiceId_fkey" FOREIGN KEY ("communionServiceId") REFERENCES "communion_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communion_records" ADD CONSTRAINT "communion_records_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
