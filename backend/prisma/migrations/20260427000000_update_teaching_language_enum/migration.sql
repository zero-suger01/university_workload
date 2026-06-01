-- Replace TeachingLanguage enum: UZBEK→UZB, RUSSIAN→RUS_ENG, ENGLISH→UZB_ENG

-- Step 1: Drop defaults that reference the old enum (required before type change)
ALTER TABLE "PlanningRow" ALTER COLUMN "teachingLanguage" DROP DEFAULT;

-- Step 2: Create replacement enum with only the new values
CREATE TYPE "TeachingLanguage_new" AS ENUM ('UZB', 'UZB_ENG', 'RUS_ENG');

-- Step 3: Migrate StudentCohort.language
ALTER TABLE "StudentCohort"
  ALTER COLUMN "language" TYPE "TeachingLanguage_new"
    USING (
      CASE "language"::text
        WHEN 'UZBEK'   THEN 'UZB'
        WHEN 'RUSSIAN' THEN 'RUS_ENG'
        WHEN 'ENGLISH' THEN 'UZB_ENG'
        ELSE 'UZB'
      END
    )::"TeachingLanguage_new";

-- Step 4: Migrate PlanningRow.teachingLanguage
ALTER TABLE "PlanningRow"
  ALTER COLUMN "teachingLanguage" TYPE "TeachingLanguage_new"
    USING (
      CASE "teachingLanguage"::text
        WHEN 'UZBEK'   THEN 'UZB'
        WHEN 'RUSSIAN' THEN 'RUS_ENG'
        WHEN 'ENGLISH' THEN 'UZB_ENG'
        ELSE 'UZB'
      END
    )::"TeachingLanguage_new";

-- Step 5: Migrate WorkloadRecord.teachingLanguage (nullable column)
ALTER TABLE "WorkloadRecord"
  ALTER COLUMN "teachingLanguage" TYPE "TeachingLanguage_new"
    USING (
      CASE "teachingLanguage"::text
        WHEN 'UZBEK'   THEN 'UZB'
        WHEN 'RUSSIAN' THEN 'RUS_ENG'
        WHEN 'ENGLISH' THEN 'UZB_ENG'
        ELSE NULL
      END
    )::"TeachingLanguage_new";

-- Step 6: Drop old enum and rename new one
DROP TYPE "TeachingLanguage";
ALTER TYPE "TeachingLanguage_new" RENAME TO "TeachingLanguage";

-- Step 7: Restore default on PlanningRow
ALTER TABLE "PlanningRow" ALTER COLUMN "teachingLanguage" SET DEFAULT 'UZB'::"TeachingLanguage";
