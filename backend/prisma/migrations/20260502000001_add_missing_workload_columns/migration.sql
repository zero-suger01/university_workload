-- Add missing columns to WorkloadRecord
ALTER TABLE "WorkloadRecord"
  ADD COLUMN IF NOT EXISTS "yearOfStudy"              INTEGER[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "semesterNumbers"          INTEGER[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "program"                  TEXT,
  ADD COLUMN IF NOT EXISTS "courseType"               TEXT,
  ADD COLUMN IF NOT EXISTS "courseECTS"               DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "semesterECTS"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "responsibleDepartment"    TEXT,
  ADD COLUMN IF NOT EXISTS "confirmedByResDept"       BOOLEAN    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "groupNumbers"             TEXT,
  ADD COLUMN IF NOT EXISTS "totalNumberOfGroups"      INTEGER,
  ADD COLUMN IF NOT EXISTS "lectureGroup"             INTEGER,
  ADD COLUMN IF NOT EXISTS "tutorialGroup"            INTEGER,
  ADD COLUMN IF NOT EXISTS "totalCoveredTutorialHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalCoveredLectureHours"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "uncoveredHours"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lecturesAndTutorialsNo"    INTEGER          NOT NULL DEFAULT 0;

-- Create WorkloadEditHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "WorkloadEditHistory" (
  "id"               TEXT        NOT NULL,
  "workloadRecordId" TEXT        NOT NULL,
  "editedById"       TEXT        NOT NULL,
  "editedByRole"     TEXT        NOT NULL,
  "editedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkloadEditHistory_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for WorkloadEditHistory (add only if they don't exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'WorkloadEditHistory_workloadRecordId_fkey'
  ) THEN
    ALTER TABLE "WorkloadEditHistory"
      ADD CONSTRAINT "WorkloadEditHistory_workloadRecordId_fkey"
      FOREIGN KEY ("workloadRecordId") REFERENCES "WorkloadRecord"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'WorkloadEditHistory_editedById_fkey'
  ) THEN
    ALTER TABLE "WorkloadEditHistory"
      ADD CONSTRAINT "WorkloadEditHistory_editedById_fkey"
      FOREIGN KEY ("editedById") REFERENCES "User"("id");
  END IF;
END $$;

-- Indexes for WorkloadEditHistory
CREATE INDEX IF NOT EXISTS "WorkloadEditHistory_workloadRecordId_idx" ON "WorkloadEditHistory"("workloadRecordId");
CREATE INDEX IF NOT EXISTS "WorkloadEditHistory_editedById_idx"       ON "WorkloadEditHistory"("editedById");
