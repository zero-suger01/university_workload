/*
  Warnings:

  - A unique constraint covering the columns `[facultyId,courseId,semesterId,groupId]` on the table `WorkloadRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AcademicPosition" AS ENUM ('TEACHING_ASSISTANT', 'LAB_ASSISTANT', 'LECTURER', 'SENIOR_LECTURER', 'ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'VISITING_PROFESSOR', 'ADJUNCT_PROFESSOR');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('BACHELOR', 'MASTER', 'PHD');

-- CreateEnum
CREATE TYPE "TeachingLanguage" AS ENUM ('UZBEK', 'RUSSIAN', 'ENGLISH');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AssignType" AS ENUM ('LECTURE', 'TUTORIAL', 'LAB');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('LECTURE_HALL', 'SEMINAR_ROOM', 'COMPUTER_LAB', 'CHEMISTRY_LAB', 'PHYSICS_LAB', 'CONFERENCE_HALL', 'ACTIVE_LEARNING', 'HYBRID');

-- CreateEnum
CREATE TYPE "CQIStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_NEEDED');

-- DropIndex
DROP INDEX "WorkloadRecord_facultyId_courseId_semesterId_key";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "courseDuration" TEXT,
ADD COLUMN     "degreeLevel" "DegreeLevel",
ADD COLUMN     "ectsCredits" DOUBLE PRECISION,
ADD COLUMN     "learningOutcome1" TEXT,
ADD COLUMN     "learningOutcome2" TEXT,
ADD COLUMN     "learningOutcome3" TEXT,
ADD COLUMN     "learningOutcome4" TEXT,
ADD COLUMN     "learningOutcome5" TEXT,
ADD COLUMN     "learningOutcome6" TEXT,
ADD COLUMN     "learningOutcome7" TEXT,
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "semesterOffered" TEXT,
ADD COLUMN     "subjectBoard" TEXT,
ADD COLUMN     "textbook" TEXT,
ADD COLUMN     "usCreditHours" DOUBLE PRECISION,
ADD COLUMN     "weeklyLabHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyLectureHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyTutorialHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "avgWeeklyLoad" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "weekCount" INTEGER NOT NULL DEFAULT 16;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicDegree" TEXT,
ADD COLUMN     "academicPosition" "AcademicPosition",
ADD COLUMN     "adminPosition" TEXT,
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME';

-- AlterTable
ALTER TABLE "WorkloadRecord" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "hoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "planningRowId" TEXT,
ADD COLUMN     "studentCount" INTEGER,
ADD COLUMN     "teachingLanguage" "TeachingLanguage",
ADD COLUMN     "weekCount" INTEGER NOT NULL DEFAULT 16;

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "building" TEXT NOT NULL,
    "buildingNo" INTEGER,
    "roomType" "RoomType" NOT NULL DEFAULT 'SEMINAR_ROOM',
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL DEFAULT 'BACHELOR',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumItem" (
    "id" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "curriculumId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCohort" (
    "id" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL,
    "language" "TeachingLanguage" NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "groupCodes" TEXT[],
    "notes" TEXT,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningRow" (
    "id" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "teachingLanguage" "TeachingLanguage" NOT NULL DEFAULT 'UZBEK',
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "groupNumbers" TEXT,
    "lectureGroups" INTEGER NOT NULL DEFAULT 1,
    "tutorialGroups" INTEGER NOT NULL DEFAULT 1,
    "labGroups" INTEGER NOT NULL DEFAULT 0,
    "jointWith" TEXT,
    "totalRequiredHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLecRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTutRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLabRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCoveredHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLecCovered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTutCovered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLabCovered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uncoveredHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PlanningStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "courseId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkloadAssignment" (
    "id" TEXT NOT NULL,
    "assignType" "AssignType" NOT NULL,
    "groupsCount" INTEGER NOT NULL DEFAULT 1,
    "hoursPerWeek" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "planningRowId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkloadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "groupType" TEXT NOT NULL DEFAULT 'TUTORIAL',
    "planningRowId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacancyRecord" (
    "id" TEXT NOT NULL,
    "totalRequired" DOUBLE PRECISION NOT NULL,
    "totalCovered" DOUBLE PRECISION NOT NULL,
    "uncoveredHours" DOUBLE PRECISION NOT NULL,
    "staffNeeded" DOUBLE PRECISION NOT NULL,
    "avgLoadUsed" DOUBLE PRECISION NOT NULL DEFAULT 480,
    "departmentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacancyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUnit" (
    "id" TEXT NOT NULL,
    "totalLectureHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTutorialHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLabHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSeminarHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consultHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courseWorkHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "practiceHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "thesisHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAuditoriyaHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAllHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffUnitsCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professorCount" INTEGER NOT NULL DEFAULT 0,
    "docentCount" INTEGER NOT NULL DEFAULT 0,
    "seniorLecturerCount" INTEGER NOT NULL DEFAULT 0,
    "lecturerCount" INTEGER NOT NULL DEFAULT 0,
    "departmentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CQIReport" (
    "id" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CQIStatus" NOT NULL DEFAULT 'DRAFT',
    "evalMidterm" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "evalFinal" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "evalAssignment" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "textbooks" JSONB NOT NULL DEFAULT '[]',
    "evalQ1Answer" TEXT,
    "evalQ2Answer" TEXT,
    "evalQ3Answer" TEXT,
    "evalQ4Answer" TEXT,
    "surveyParticipation" INTEGER,
    "surveyFollowsSyllabus" DOUBLE PRECISION,
    "surveySatisfaction" DOUBLE PRECISION,
    "surveyAvgScore" DOUBLE PRECISION,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CQIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySyllabus" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "date" TEXT,
    "topic" TEXT NOT NULL,
    "tutorials" TEXT,
    "cqiId" TEXT NOT NULL,

    CONSTRAINT "WeeklySyllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CLOAssessment" (
    "id" TEXT NOT NULL,
    "cloNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "teachingMethods" TEXT[],
    "assessmentTools" TEXT[],
    "perfHigh" TEXT,
    "perfMedium" TEXT,
    "perfLow" TEXT,
    "plosHigh" TEXT[],
    "plosMedium" TEXT[],
    "plosLow" TEXT[],
    "cqiId" TEXT NOT NULL,

    CONSTRAINT "CLOAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseObjective" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "CourseObjective_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_roomType_idx" ON "Room"("roomType");

-- CreateIndex
CREATE INDEX "Room_departmentId_idx" ON "Room"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Program_code_key" ON "Program"("code");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE INDEX "Program_degreeLevel_idx" ON "Program"("degreeLevel");

-- CreateIndex
CREATE INDEX "Curriculum_programId_idx" ON "Curriculum"("programId");

-- CreateIndex
CREATE INDEX "CurriculumItem_curriculumId_idx" ON "CurriculumItem"("curriculumId");

-- CreateIndex
CREATE INDEX "CurriculumItem_courseId_idx" ON "CurriculumItem"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumItem_curriculumId_courseId_semesterNumber_key" ON "CurriculumItem"("curriculumId", "courseId", "semesterNumber");

-- CreateIndex
CREATE INDEX "StudentCohort_programId_semesterId_idx" ON "StudentCohort"("programId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCohort_programId_semesterId_yearOfStudy_language_key" ON "StudentCohort"("programId", "semesterId", "yearOfStudy", "language");

-- CreateIndex
CREATE INDEX "PlanningRow_semesterId_programId_idx" ON "PlanningRow"("semesterId", "programId");

-- CreateIndex
CREATE INDEX "PlanningRow_courseId_semesterId_idx" ON "PlanningRow"("courseId", "semesterId");

-- CreateIndex
CREATE INDEX "PlanningRow_status_idx" ON "PlanningRow"("status");

-- CreateIndex
CREATE INDEX "WorkloadAssignment_planningRowId_idx" ON "WorkloadAssignment"("planningRowId");

-- CreateIndex
CREATE INDEX "WorkloadAssignment_facultyId_idx" ON "WorkloadAssignment"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkloadAssignment_planningRowId_facultyId_assignType_key" ON "WorkloadAssignment"("planningRowId", "facultyId", "assignType");

-- CreateIndex
CREATE INDEX "Group_planningRowId_idx" ON "Group"("planningRowId");

-- CreateIndex
CREATE INDEX "Group_programId_idx" ON "Group"("programId");

-- CreateIndex
CREATE INDEX "VacancyRecord_semesterId_idx" ON "VacancyRecord"("semesterId");

-- CreateIndex
CREATE INDEX "VacancyRecord_departmentId_idx" ON "VacancyRecord"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "VacancyRecord_departmentId_semesterId_key" ON "VacancyRecord"("departmentId", "semesterId");

-- CreateIndex
CREATE INDEX "StaffUnit_departmentId_idx" ON "StaffUnit"("departmentId");

-- CreateIndex
CREATE INDEX "StaffUnit_semesterId_idx" ON "StaffUnit"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUnit_departmentId_semesterId_key" ON "StaffUnit"("departmentId", "semesterId");

-- CreateIndex
CREATE INDEX "CQIReport_courseId_semesterId_idx" ON "CQIReport"("courseId", "semesterId");

-- CreateIndex
CREATE INDEX "CQIReport_facultyId_idx" ON "CQIReport"("facultyId");

-- CreateIndex
CREATE INDEX "CQIReport_status_idx" ON "CQIReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CQIReport_courseId_semesterId_facultyId_key" ON "CQIReport"("courseId", "semesterId", "facultyId");

-- CreateIndex
CREATE INDEX "WeeklySyllabus_cqiId_idx" ON "WeeklySyllabus"("cqiId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySyllabus_cqiId_week_key" ON "WeeklySyllabus"("cqiId", "week");

-- CreateIndex
CREATE INDEX "CLOAssessment_cqiId_idx" ON "CLOAssessment"("cqiId");

-- CreateIndex
CREATE UNIQUE INDEX "CLOAssessment_cqiId_cloNumber_key" ON "CLOAssessment"("cqiId", "cloNumber");

-- CreateIndex
CREATE INDEX "CourseObjective_courseId_idx" ON "CourseObjective"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseObjective_courseId_number_key" ON "CourseObjective"("courseId", "number");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Course_subjectBoard_idx" ON "Course"("subjectBoard");

-- CreateIndex
CREATE INDEX "Course_isActive_departmentId_idx" ON "Course"("isActive", "departmentId");

-- CreateIndex
CREATE INDEX "Report_semesterId_idx" ON "Report"("semesterId");

-- CreateIndex
CREATE INDEX "User_academicPosition_idx" ON "User"("academicPosition");

-- CreateIndex
CREATE INDEX "User_employmentType_idx" ON "User"("employmentType");

-- CreateIndex
CREATE INDEX "WorkloadRecord_courseId_semesterId_idx" ON "WorkloadRecord"("courseId", "semesterId");

-- CreateIndex
CREATE INDEX "WorkloadRecord_groupId_idx" ON "WorkloadRecord"("groupId");

-- CreateIndex
CREATE INDEX "WorkloadRecord_planningRowId_idx" ON "WorkloadRecord"("planningRowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkloadRecord_facultyId_courseId_semesterId_groupId_key" ON "WorkloadRecord"("facultyId", "courseId", "semesterId", "groupId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumItem" ADD CONSTRAINT "CurriculumItem_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumItem" ADD CONSTRAINT "CurriculumItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCohort" ADD CONSTRAINT "StudentCohort_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCohort" ADD CONSTRAINT "StudentCohort_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRow" ADD CONSTRAINT "PlanningRow_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRow" ADD CONSTRAINT "PlanningRow_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningRow" ADD CONSTRAINT "PlanningRow_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadAssignment" ADD CONSTRAINT "WorkloadAssignment_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES "PlanningRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadAssignment" ADD CONSTRAINT "WorkloadAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES "PlanningRow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadRecord" ADD CONSTRAINT "WorkloadRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkloadRecord" ADD CONSTRAINT "WorkloadRecord_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES "PlanningRow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyRecord" ADD CONSTRAINT "VacancyRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacancyRecord" ADD CONSTRAINT "VacancyRecord_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUnit" ADD CONSTRAINT "StaffUnit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUnit" ADD CONSTRAINT "StaffUnit_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CQIReport" ADD CONSTRAINT "CQIReport_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CQIReport" ADD CONSTRAINT "CQIReport_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CQIReport" ADD CONSTRAINT "CQIReport_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySyllabus" ADD CONSTRAINT "WeeklySyllabus_cqiId_fkey" FOREIGN KEY ("cqiId") REFERENCES "CQIReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CLOAssessment" ADD CONSTRAINT "CLOAssessment_cqiId_fkey" FOREIGN KEY ("cqiId") REFERENCES "CQIReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseObjective" ADD CONSTRAINT "CourseObjective_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
