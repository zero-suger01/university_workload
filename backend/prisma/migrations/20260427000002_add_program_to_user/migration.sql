-- Add optional programId to User
ALTER TABLE "User" ADD COLUMN "programId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "User_programId_idx" ON "User"("programId");
