-- CreateEnum
CREATE TYPE "CommunionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "communion_services" ADD COLUMN     "status" "CommunionStatus" NOT NULL DEFAULT 'DRAFT';
