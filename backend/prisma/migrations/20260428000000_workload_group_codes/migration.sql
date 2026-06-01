-- AlterTable: add groupCodes array to WorkloadRecord
ALTER TABLE "WorkloadRecord" ADD COLUMN "groupCodes" TEXT[] NOT NULL DEFAULT '{}';
