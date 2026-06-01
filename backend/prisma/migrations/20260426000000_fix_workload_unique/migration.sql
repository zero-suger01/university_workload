-- Fix WorkloadRecord duplicate bug.
-- PostgreSQL treats NULL != NULL in unique indexes, so the constraint on
-- (facultyId, courseId, semesterId, groupId) allows unlimited duplicates
-- whenever groupId IS NULL. Restore the original constraint without groupId.

-- Step 1: remove duplicates — keep the earliest record per faculty+course+semester
DELETE FROM "WorkloadRecord"
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "facultyId", "courseId", "semesterId"
             ORDER BY "createdAt" ASC
           ) AS rn
    FROM "WorkloadRecord"
  ) t
  WHERE rn = 1
);

-- Step 2: drop the buggy nullable constraint
DROP INDEX IF EXISTS "WorkloadRecord_facultyId_courseId_semesterId_groupId_key";

-- Step 3: add the correct constraint (no groupId)
CREATE UNIQUE INDEX "WorkloadRecord_facultyId_courseId_semesterId_key"
  ON "WorkloadRecord"("facultyId", "courseId", "semesterId");
