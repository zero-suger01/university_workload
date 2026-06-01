-- Add FK constraint for WorkloadRecord.assignedById → User.id
-- The column already exists; we're just formalising the relation.
ALTER TABLE "WorkloadRecord"
  ADD CONSTRAINT "WorkloadRecord_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "WorkloadRecord_assignedById_idx" ON "WorkloadRecord"("assignedById");
