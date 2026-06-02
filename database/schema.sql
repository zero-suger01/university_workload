--
-- PostgreSQL database dump
--

\restrict PMa54TpwN16RkoQhi9LWa9gB8ADukiOrHKoNdUBIp9IovRTcHx2MhXxlutG81JQ

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: workload_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO workload_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: workload_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AcademicPosition; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."AcademicPosition" AS ENUM (
    'TEACHING_ASSISTANT',
    'LAB_ASSISTANT',
    'LECTURER',
    'SENIOR_LECTURER',
    'ASSISTANT_PROFESSOR',
    'ASSOCIATE_PROFESSOR',
    'PROFESSOR',
    'VISITING_PROFESSOR',
    'ADJUNCT_PROFESSOR',
    'PROFESSOR_IN_PRACTICE',
    'VISITING_FULLTIME_PROFESSOR',
    'VISITING_ASSOCIATE_PROFESSOR',
    'HEAD_OF_DEPARTMENT',
    'ASSOCIATE_DEAN',
    'ASSISTANT_DEAN',
    'DEAN',
    'DIRECTOR',
    'ASSOCIATE_DIRECTOR',
    'POSTDOC'
);


ALTER TYPE public."AcademicPosition" OWNER TO workload_user;

--
-- Name: AssignType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."AssignType" AS ENUM (
    'LECTURE',
    'TUTORIAL',
    'LAB'
);


ALTER TYPE public."AssignType" OWNER TO workload_user;

--
-- Name: CQIStatus; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."CQIStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REVISION_NEEDED'
);


ALTER TYPE public."CQIStatus" OWNER TO workload_user;

--
-- Name: CourseType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."CourseType" AS ENUM (
    'LECTURE',
    'SEMINAR',
    'LAB',
    'BOTH',
    'OTHER'
);


ALTER TYPE public."CourseType" OWNER TO workload_user;

--
-- Name: DegreeLevel; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."DegreeLevel" AS ENUM (
    'BACHELOR',
    'MASTER',
    'PHD'
);


ALTER TYPE public."DegreeLevel" OWNER TO workload_user;

--
-- Name: EmploymentType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME'
);


ALTER TYPE public."EmploymentType" OWNER TO workload_user;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."Gender" OWNER TO workload_user;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."NotificationType" AS ENUM (
    'WORKLOAD_ASSIGNED',
    'REQUEST_SUBMITTED',
    'REQUEST_APPROVED',
    'REQUEST_REJECTED',
    'DEADLINE_REMINDER',
    'SYSTEM_ALERT'
);


ALTER TYPE public."NotificationType" OWNER TO workload_user;

--
-- Name: PlanningStatus; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."PlanningStatus" AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'PUBLISHED'
);


ALTER TYPE public."PlanningStatus" OWNER TO workload_user;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."RequestStatus" OWNER TO workload_user;

--
-- Name: RequestType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."RequestType" AS ENUM (
    'ADD_COURSE',
    'REMOVE_COURSE',
    'ADJUST_HOURS',
    'EXTRA_ACTIVITY',
    'OVERLOAD_REQUEST',
    'WORKLOAD_DECLINED'
);


ALTER TYPE public."RequestType" OWNER TO workload_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'DEPARTMENT_HEAD',
    'FACULTY'
);


ALTER TYPE public."Role" OWNER TO workload_user;

--
-- Name: RoomType; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."RoomType" AS ENUM (
    'LECTURE_HALL',
    'SEMINAR_ROOM',
    'COMPUTER_LAB',
    'CHEMISTRY_LAB',
    'PHYSICS_LAB',
    'CONFERENCE_HALL',
    'ACTIVE_LEARNING',
    'HYBRID'
);


ALTER TYPE public."RoomType" OWNER TO workload_user;

--
-- Name: TeachingLanguage; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."TeachingLanguage" AS ENUM (
    'UZB',
    'UZB_ENG',
    'RUS_ENG'
);


ALTER TYPE public."TeachingLanguage" OWNER TO workload_user;

--
-- Name: WorkloadApprovalStatus; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."WorkloadApprovalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."WorkloadApprovalStatus" OWNER TO workload_user;

--
-- Name: WorkloadStatus; Type: TYPE; Schema: public; Owner: workload_user
--

CREATE TYPE public."WorkloadStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."WorkloadStatus" OWNER TO workload_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "performedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO workload_user;

--
-- Name: CLOAssessment; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."CLOAssessment" (
    id text NOT NULL,
    "cloNumber" integer NOT NULL,
    description text NOT NULL,
    "teachingMethods" text[],
    "assessmentTools" text[],
    "perfHigh" text,
    "perfMedium" text,
    "perfLow" text,
    "plosHigh" text[],
    "plosMedium" text[],
    "plosLow" text[],
    "cqiId" text NOT NULL
);


ALTER TABLE public."CLOAssessment" OWNER TO workload_user;

--
-- Name: CQIReport; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."CQIReport" (
    id text NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    status public."CQIStatus" DEFAULT 'DRAFT'::public."CQIStatus" NOT NULL,
    "evalMidterm" double precision DEFAULT 40 NOT NULL,
    "evalFinal" double precision DEFAULT 40 NOT NULL,
    "evalAssignment" double precision DEFAULT 20 NOT NULL,
    textbooks jsonb DEFAULT '[]'::jsonb NOT NULL,
    "evalQ1Answer" text,
    "evalQ2Answer" text,
    "evalQ3Answer" text,
    "evalQ4Answer" text,
    "surveyParticipation" integer,
    "surveyFollowsSyllabus" double precision,
    "surveySatisfaction" double precision,
    "surveyAvgScore" double precision,
    "reviewNotes" text,
    "submittedAt" timestamp(3) without time zone,
    "approvedAt" timestamp(3) without time zone,
    "courseId" text NOT NULL,
    "semesterId" text NOT NULL,
    "facultyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CQIReport" OWNER TO workload_user;

--
-- Name: Course; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Course" (
    id text NOT NULL,
    "courseCode" text NOT NULL,
    title text NOT NULL,
    description text,
    "creditUnits" double precision NOT NULL,
    "weeklyHours" double precision NOT NULL,
    "maxStudents" integer DEFAULT 40 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "departmentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "courseDuration" text,
    "ectsCredits" double precision,
    "learningOutcome1" text,
    "learningOutcome2" text,
    "learningOutcome3" text,
    "learningOutcome4" text,
    "learningOutcome5" text,
    "learningOutcome6" text,
    "learningOutcome7" text,
    prerequisites text,
    "semesterOffered" text,
    "subjectBoard" text,
    textbook text,
    "usCreditHours" double precision,
    "weeklyLabHours" double precision DEFAULT 0 NOT NULL,
    "weeklyLectureHours" double precision DEFAULT 0 NOT NULL,
    "weeklyTutorialHours" double precision DEFAULT 0 NOT NULL,
    "learningOutcome8" text,
    "learningOutcome9" text,
    "learningOutcome10" text,
    "learningOutcome11" text,
    "learningOutcome12" text,
    "learningOutcome13" text,
    "learningOutcome14" text,
    "responsibleDepartment" text,
    "syllabusTemplate" text,
    term text,
    "degreeLevel" text,
    type public."CourseType" NOT NULL,
    "accreditationArea" text,
    format text,
    "gradeStatus" text,
    "instructorInfo" text,
    "lastDayToAddDrop" text,
    "lastDayToRegister" text,
    "meetingInfo" text,
    notes text,
    "partOfTerm" text,
    "seatsAvailable" integer,
    "waitlistTotal" integer
);


ALTER TABLE public."Course" OWNER TO workload_user;

--
-- Name: CourseObjective; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."CourseObjective" (
    id text NOT NULL,
    number integer NOT NULL,
    description text NOT NULL,
    "courseId" text NOT NULL
);


ALTER TABLE public."CourseObjective" OWNER TO workload_user;

--
-- Name: Curriculum; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Curriculum" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "programId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Curriculum" OWNER TO workload_user;

--
-- Name: CurriculumItem; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."CurriculumItem" (
    id text NOT NULL,
    "semesterNumber" integer NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "curriculumId" text NOT NULL,
    "courseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CurriculumItem" OWNER TO workload_user;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avgWeeklyLoad" double precision DEFAULT 30 NOT NULL
);


ALTER TABLE public."Department" OWNER TO workload_user;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Group" (
    id text NOT NULL,
    name text NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "groupType" text DEFAULT 'TUTORIAL'::text NOT NULL,
    "planningRowId" text NOT NULL,
    "programId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Group" OWNER TO workload_user;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    metadata jsonb,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO workload_user;

--
-- Name: PlanningRow; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."PlanningRow" (
    id text NOT NULL,
    "yearOfStudy" integer NOT NULL,
    "semesterNumber" integer NOT NULL,
    "teachingLanguage" public."TeachingLanguage" DEFAULT 'UZB'::public."TeachingLanguage" NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "groupNumbers" text,
    "lectureGroups" integer DEFAULT 1 NOT NULL,
    "tutorialGroups" integer DEFAULT 1 NOT NULL,
    "labGroups" integer DEFAULT 0 NOT NULL,
    "jointWith" text,
    "totalRequiredHours" double precision DEFAULT 0 NOT NULL,
    "totalLecRequired" double precision DEFAULT 0 NOT NULL,
    "totalTutRequired" double precision DEFAULT 0 NOT NULL,
    "totalLabRequired" double precision DEFAULT 0 NOT NULL,
    "totalCoveredHours" double precision DEFAULT 0 NOT NULL,
    "totalLecCovered" double precision DEFAULT 0 NOT NULL,
    "totalTutCovered" double precision DEFAULT 0 NOT NULL,
    "totalLabCovered" double precision DEFAULT 0 NOT NULL,
    "uncoveredHours" double precision DEFAULT 0 NOT NULL,
    status public."PlanningStatus" DEFAULT 'DRAFT'::public."PlanningStatus" NOT NULL,
    notes text,
    "courseId" text NOT NULL,
    "programId" text NOT NULL,
    "semesterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "confirmedByResDept" boolean DEFAULT false NOT NULL,
    "totalSmallGroups" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."PlanningRow" OWNER TO workload_user;

--
-- Name: Program; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Program" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "degreeLevel" public."DegreeLevel" DEFAULT 'BACHELOR'::public."DegreeLevel" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "departmentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Program" OWNER TO workload_user;

--
-- Name: Report; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    format text NOT NULL,
    "fileUrl" text,
    parameters jsonb NOT NULL,
    "generatedById" text NOT NULL,
    "semesterId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Report" OWNER TO workload_user;

--
-- Name: Request; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Request" (
    id text NOT NULL,
    type public."RequestType" NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    "attachmentUrl" text,
    "reviewNotes" text,
    "resolvedAt" timestamp(3) without time zone,
    "submittedById" text NOT NULL,
    "reviewedById" text,
    "workloadId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Request" OWNER TO workload_user;

--
-- Name: Room; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    code text NOT NULL,
    number text NOT NULL,
    capacity integer NOT NULL,
    building text NOT NULL,
    "buildingNo" integer,
    "roomType" public."RoomType" DEFAULT 'SEMINAR_ROOM'::public."RoomType" NOT NULL,
    description text,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "departmentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Room" OWNER TO workload_user;

--
-- Name: Semester; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."Semester" (
    id text NOT NULL,
    name text NOT NULL,
    "academicYear" text NOT NULL,
    term integer NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "isCurrent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "weekCount" integer DEFAULT 16 NOT NULL
);


ALTER TABLE public."Semester" OWNER TO workload_user;

--
-- Name: StaffUnit; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."StaffUnit" (
    id text NOT NULL,
    "totalLectureHours" double precision DEFAULT 0 NOT NULL,
    "totalTutorialHours" double precision DEFAULT 0 NOT NULL,
    "totalLabHours" double precision DEFAULT 0 NOT NULL,
    "totalSeminarHours" double precision DEFAULT 0 NOT NULL,
    "ratingHours" double precision DEFAULT 0 NOT NULL,
    "consultHours" double precision DEFAULT 0 NOT NULL,
    "courseWorkHours" double precision DEFAULT 0 NOT NULL,
    "practiceHours" double precision DEFAULT 0 NOT NULL,
    "thesisHours" double precision DEFAULT 0 NOT NULL,
    "totalAuditoriyaHours" double precision DEFAULT 0 NOT NULL,
    "totalAllHours" double precision DEFAULT 0 NOT NULL,
    "staffUnitsCount" double precision DEFAULT 0 NOT NULL,
    "avgLoad" double precision DEFAULT 0 NOT NULL,
    "professorCount" integer DEFAULT 0 NOT NULL,
    "docentCount" integer DEFAULT 0 NOT NULL,
    "seniorLecturerCount" integer DEFAULT 0 NOT NULL,
    "lecturerCount" integer DEFAULT 0 NOT NULL,
    "departmentId" text NOT NULL,
    "semesterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StaffUnit" OWNER TO workload_user;

--
-- Name: StudentCohort; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."StudentCohort" (
    id text NOT NULL,
    "yearOfStudy" integer NOT NULL,
    language public."TeachingLanguage" NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "groupCodes" text[],
    notes text,
    "programId" text NOT NULL,
    "semesterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StudentCohort" OWNER TO workload_user;

--
-- Name: User; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    role public."Role" DEFAULT 'FACULTY'::public."Role" NOT NULL,
    "profilePhoto" text,
    "phoneNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "maxWeeklyHours" integer DEFAULT 40 NOT NULL,
    "minWeeklyHours" integer DEFAULT 12 NOT NULL,
    "departmentId" text NOT NULL,
    "refreshToken" text,
    "passwordResetToken" text,
    "passwordResetExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "academicDegree" text,
    "academicPosition" public."AcademicPosition",
    "adminPosition" text,
    "employmentType" public."EmploymentType" DEFAULT 'FULL_TIME'::public."EmploymentType" NOT NULL,
    "tempPassword" text,
    "programId" text,
    gender public."Gender",
    "facultyDepartment" text
);


ALTER TABLE public."User" OWNER TO workload_user;

--
-- Name: VacancyRecord; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."VacancyRecord" (
    id text NOT NULL,
    "totalRequired" double precision NOT NULL,
    "totalCovered" double precision NOT NULL,
    "uncoveredHours" double precision NOT NULL,
    "staffNeeded" double precision NOT NULL,
    "avgLoadUsed" double precision DEFAULT 480 NOT NULL,
    "departmentId" text NOT NULL,
    "semesterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VacancyRecord" OWNER TO workload_user;

--
-- Name: WeeklySyllabus; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."WeeklySyllabus" (
    id text NOT NULL,
    week integer NOT NULL,
    date text,
    topic text NOT NULL,
    tutorials text,
    "cqiId" text NOT NULL
);


ALTER TABLE public."WeeklySyllabus" OWNER TO workload_user;

--
-- Name: WorkloadAssignment; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."WorkloadAssignment" (
    id text NOT NULL,
    "assignType" public."AssignType" NOT NULL,
    "groupsCount" integer DEFAULT 1 NOT NULL,
    "hoursPerWeek" double precision DEFAULT 0 NOT NULL,
    "totalHours" double precision DEFAULT 0 NOT NULL,
    notes text,
    "planningRowId" text NOT NULL,
    "facultyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."WorkloadAssignment" OWNER TO workload_user;

--
-- Name: WorkloadEditHistory; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."WorkloadEditHistory" (
    id text NOT NULL,
    "workloadRecordId" text NOT NULL,
    "editedById" text NOT NULL,
    "editedByRole" text NOT NULL,
    "editedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WorkloadEditHistory" OWNER TO workload_user;

--
-- Name: WorkloadRecord; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public."WorkloadRecord" (
    id text NOT NULL,
    "totalHours" double precision NOT NULL,
    status public."WorkloadStatus" DEFAULT 'DRAFT'::public."WorkloadStatus" NOT NULL,
    notes text,
    "isOverloaded" boolean DEFAULT false NOT NULL,
    "isUnderloaded" boolean DEFAULT false NOT NULL,
    "facultyId" text NOT NULL,
    "courseId" text NOT NULL,
    "semesterId" text NOT NULL,
    "lectureHours" double precision DEFAULT 0 NOT NULL,
    "seminarHours" double precision DEFAULT 0 NOT NULL,
    "labHours" double precision DEFAULT 0 NOT NULL,
    "advisingHours" double precision DEFAULT 0 NOT NULL,
    "researchHours" double precision DEFAULT 0 NOT NULL,
    "adminHours" double precision DEFAULT 0 NOT NULL,
    "otherHours" double precision DEFAULT 0 NOT NULL,
    "assignedById" text,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "groupId" text,
    "hoursPerWeek" double precision DEFAULT 0 NOT NULL,
    "planningRowId" text,
    "studentCount" integer,
    "teachingLanguage" public."TeachingLanguage",
    "weekCount" integer DEFAULT 16 NOT NULL,
    "groupCodes" text[] DEFAULT '{}'::text[] NOT NULL,
    "confirmedByResDept" boolean DEFAULT false NOT NULL,
    "courseECTS" double precision,
    "courseType" text,
    "groupNumbers" text,
    "lectureGroup" integer,
    program text,
    "responsibleDepartment" text,
    "semesterECTS" double precision,
    "semesterNumbers" integer[],
    "totalCoveredLectureHours" double precision DEFAULT 0 NOT NULL,
    "totalCoveredTutorialHours" double precision DEFAULT 0 NOT NULL,
    "totalNumberOfGroups" integer,
    "tutorialGroup" integer,
    "yearOfStudy" integer[],
    "lecturesAndTutorialsNo" integer DEFAULT 0 NOT NULL,
    "uncoveredHours" double precision DEFAULT 0 NOT NULL,
    "totalSmallGroup" integer DEFAULT 0 NOT NULL,
    school text,
    "totalCoveredLabHours" double precision DEFAULT 0 NOT NULL,
    "approvalStatus" public."WorkloadApprovalStatus" DEFAULT 'PENDING'::public."WorkloadApprovalStatus" NOT NULL,
    "rejectionReason" text,
    "assignedLabHours" double precision DEFAULT 0 NOT NULL,
    "assignedLectureHours" double precision DEFAULT 0 NOT NULL,
    "assignedTutorialHours" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public."WorkloadRecord" OWNER TO workload_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: workload_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO workload_user;

--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CLOAssessment CLOAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CLOAssessment"
    ADD CONSTRAINT "CLOAssessment_pkey" PRIMARY KEY (id);


--
-- Name: CQIReport CQIReport_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CQIReport"
    ADD CONSTRAINT "CQIReport_pkey" PRIMARY KEY (id);


--
-- Name: CourseObjective CourseObjective_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CourseObjective"
    ADD CONSTRAINT "CourseObjective_pkey" PRIMARY KEY (id);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: CurriculumItem CurriculumItem_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CurriculumItem"
    ADD CONSTRAINT "CurriculumItem_pkey" PRIMARY KEY (id);


--
-- Name: Curriculum Curriculum_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Curriculum"
    ADD CONSTRAINT "Curriculum_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PlanningRow PlanningRow_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."PlanningRow"
    ADD CONSTRAINT "PlanningRow_pkey" PRIMARY KEY (id);


--
-- Name: Program Program_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: Semester Semester_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Semester"
    ADD CONSTRAINT "Semester_pkey" PRIMARY KEY (id);


--
-- Name: StaffUnit StaffUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StaffUnit"
    ADD CONSTRAINT "StaffUnit_pkey" PRIMARY KEY (id);


--
-- Name: StudentCohort StudentCohort_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StudentCohort"
    ADD CONSTRAINT "StudentCohort_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VacancyRecord VacancyRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."VacancyRecord"
    ADD CONSTRAINT "VacancyRecord_pkey" PRIMARY KEY (id);


--
-- Name: WeeklySyllabus WeeklySyllabus_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WeeklySyllabus"
    ADD CONSTRAINT "WeeklySyllabus_pkey" PRIMARY KEY (id);


--
-- Name: WorkloadAssignment WorkloadAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadAssignment"
    ADD CONSTRAINT "WorkloadAssignment_pkey" PRIMARY KEY (id);


--
-- Name: WorkloadEditHistory WorkloadEditHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadEditHistory"
    ADD CONSTRAINT "WorkloadEditHistory_pkey" PRIMARY KEY (id);


--
-- Name: WorkloadRecord WorkloadRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "AuditLog_entityType_entityId_idx" ON public."AuditLog" USING btree ("entityType", "entityId");


--
-- Name: AuditLog_performedById_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "AuditLog_performedById_idx" ON public."AuditLog" USING btree ("performedById");


--
-- Name: CLOAssessment_cqiId_cloNumber_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "CLOAssessment_cqiId_cloNumber_key" ON public."CLOAssessment" USING btree ("cqiId", "cloNumber");


--
-- Name: CLOAssessment_cqiId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CLOAssessment_cqiId_idx" ON public."CLOAssessment" USING btree ("cqiId");


--
-- Name: CQIReport_courseId_semesterId_facultyId_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "CQIReport_courseId_semesterId_facultyId_key" ON public."CQIReport" USING btree ("courseId", "semesterId", "facultyId");


--
-- Name: CQIReport_courseId_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CQIReport_courseId_semesterId_idx" ON public."CQIReport" USING btree ("courseId", "semesterId");


--
-- Name: CQIReport_facultyId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CQIReport_facultyId_idx" ON public."CQIReport" USING btree ("facultyId");


--
-- Name: CQIReport_status_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CQIReport_status_idx" ON public."CQIReport" USING btree (status);


--
-- Name: CourseObjective_courseId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CourseObjective_courseId_idx" ON public."CourseObjective" USING btree ("courseId");


--
-- Name: CourseObjective_courseId_number_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "CourseObjective_courseId_number_key" ON public."CourseObjective" USING btree ("courseId", number);


--
-- Name: Course_courseCode_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Course_courseCode_key" ON public."Course" USING btree ("courseCode");


--
-- Name: Course_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Course_departmentId_idx" ON public."Course" USING btree ("departmentId");


--
-- Name: Course_isActive_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Course_isActive_departmentId_idx" ON public."Course" USING btree ("isActive", "departmentId");


--
-- Name: Course_subjectBoard_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Course_subjectBoard_idx" ON public."Course" USING btree ("subjectBoard");


--
-- Name: Course_type_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Course_type_idx" ON public."Course" USING btree (type);


--
-- Name: CurriculumItem_courseId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CurriculumItem_courseId_idx" ON public."CurriculumItem" USING btree ("courseId");


--
-- Name: CurriculumItem_curriculumId_courseId_semesterNumber_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "CurriculumItem_curriculumId_courseId_semesterNumber_key" ON public."CurriculumItem" USING btree ("curriculumId", "courseId", "semesterNumber");


--
-- Name: CurriculumItem_curriculumId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "CurriculumItem_curriculumId_idx" ON public."CurriculumItem" USING btree ("curriculumId");


--
-- Name: Curriculum_programId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Curriculum_programId_idx" ON public."Curriculum" USING btree ("programId");


--
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Department_code_key" ON public."Department" USING btree (code);


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Group_planningRowId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Group_planningRowId_idx" ON public."Group" USING btree ("planningRowId");


--
-- Name: Group_programId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Group_programId_idx" ON public."Group" USING btree ("programId");


--
-- Name: Notification_userId_isRead_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Notification_userId_isRead_idx" ON public."Notification" USING btree ("userId", "isRead");


--
-- Name: PlanningRow_courseId_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "PlanningRow_courseId_semesterId_idx" ON public."PlanningRow" USING btree ("courseId", "semesterId");


--
-- Name: PlanningRow_semesterId_programId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "PlanningRow_semesterId_programId_idx" ON public."PlanningRow" USING btree ("semesterId", "programId");


--
-- Name: PlanningRow_status_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "PlanningRow_status_idx" ON public."PlanningRow" USING btree (status);


--
-- Name: Program_code_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Program_code_key" ON public."Program" USING btree (code);


--
-- Name: Program_degreeLevel_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Program_degreeLevel_idx" ON public."Program" USING btree ("degreeLevel");


--
-- Name: Program_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Program_departmentId_idx" ON public."Program" USING btree ("departmentId");


--
-- Name: Report_generatedById_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Report_generatedById_idx" ON public."Report" USING btree ("generatedById");


--
-- Name: Report_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Report_semesterId_idx" ON public."Report" USING btree ("semesterId");


--
-- Name: Request_status_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Request_status_idx" ON public."Request" USING btree (status);


--
-- Name: Request_submittedById_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Request_submittedById_idx" ON public."Request" USING btree ("submittedById");


--
-- Name: Request_type_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Request_type_idx" ON public."Request" USING btree (type);


--
-- Name: Room_code_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Room_code_key" ON public."Room" USING btree (code);


--
-- Name: Room_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Room_departmentId_idx" ON public."Room" USING btree ("departmentId");


--
-- Name: Room_roomType_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "Room_roomType_idx" ON public."Room" USING btree ("roomType");


--
-- Name: Semester_academicYear_term_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "Semester_academicYear_term_key" ON public."Semester" USING btree ("academicYear", term);


--
-- Name: StaffUnit_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "StaffUnit_departmentId_idx" ON public."StaffUnit" USING btree ("departmentId");


--
-- Name: StaffUnit_departmentId_semesterId_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "StaffUnit_departmentId_semesterId_key" ON public."StaffUnit" USING btree ("departmentId", "semesterId");


--
-- Name: StaffUnit_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "StaffUnit_semesterId_idx" ON public."StaffUnit" USING btree ("semesterId");


--
-- Name: StudentCohort_programId_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "StudentCohort_programId_semesterId_idx" ON public."StudentCohort" USING btree ("programId", "semesterId");


--
-- Name: User_academicPosition_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "User_academicPosition_idx" ON public."User" USING btree ("academicPosition");


--
-- Name: User_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "User_departmentId_idx" ON public."User" USING btree ("departmentId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_employeeId_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "User_employeeId_key" ON public."User" USING btree ("employeeId");


--
-- Name: User_employmentType_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "User_employmentType_idx" ON public."User" USING btree ("employmentType");


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: VacancyRecord_departmentId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "VacancyRecord_departmentId_idx" ON public."VacancyRecord" USING btree ("departmentId");


--
-- Name: VacancyRecord_departmentId_semesterId_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "VacancyRecord_departmentId_semesterId_key" ON public."VacancyRecord" USING btree ("departmentId", "semesterId");


--
-- Name: VacancyRecord_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "VacancyRecord_semesterId_idx" ON public."VacancyRecord" USING btree ("semesterId");


--
-- Name: WeeklySyllabus_cqiId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WeeklySyllabus_cqiId_idx" ON public."WeeklySyllabus" USING btree ("cqiId");


--
-- Name: WeeklySyllabus_cqiId_week_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "WeeklySyllabus_cqiId_week_key" ON public."WeeklySyllabus" USING btree ("cqiId", week);


--
-- Name: WorkloadAssignment_facultyId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadAssignment_facultyId_idx" ON public."WorkloadAssignment" USING btree ("facultyId");


--
-- Name: WorkloadAssignment_planningRowId_facultyId_assignType_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "WorkloadAssignment_planningRowId_facultyId_assignType_key" ON public."WorkloadAssignment" USING btree ("planningRowId", "facultyId", "assignType");


--
-- Name: WorkloadAssignment_planningRowId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadAssignment_planningRowId_idx" ON public."WorkloadAssignment" USING btree ("planningRowId");


--
-- Name: WorkloadEditHistory_editedById_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadEditHistory_editedById_idx" ON public."WorkloadEditHistory" USING btree ("editedById");


--
-- Name: WorkloadEditHistory_workloadRecordId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadEditHistory_workloadRecordId_idx" ON public."WorkloadEditHistory" USING btree ("workloadRecordId");


--
-- Name: WorkloadRecord_courseId_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadRecord_courseId_semesterId_idx" ON public."WorkloadRecord" USING btree ("courseId", "semesterId");


--
-- Name: WorkloadRecord_facultyId_courseId_semesterId_key; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE UNIQUE INDEX "WorkloadRecord_facultyId_courseId_semesterId_key" ON public."WorkloadRecord" USING btree ("facultyId", "courseId", "semesterId");


--
-- Name: WorkloadRecord_facultyId_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadRecord_facultyId_semesterId_idx" ON public."WorkloadRecord" USING btree ("facultyId", "semesterId");


--
-- Name: WorkloadRecord_groupId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadRecord_groupId_idx" ON public."WorkloadRecord" USING btree ("groupId");


--
-- Name: WorkloadRecord_planningRowId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadRecord_planningRowId_idx" ON public."WorkloadRecord" USING btree ("planningRowId");


--
-- Name: WorkloadRecord_status_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "WorkloadRecord_status_idx" ON public."WorkloadRecord" USING btree (status);


--
-- Name: AuditLog AuditLog_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CLOAssessment CLOAssessment_cqiId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CLOAssessment"
    ADD CONSTRAINT "CLOAssessment_cqiId_fkey" FOREIGN KEY ("cqiId") REFERENCES public."CQIReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CQIReport CQIReport_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CQIReport"
    ADD CONSTRAINT "CQIReport_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CQIReport CQIReport_facultyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CQIReport"
    ADD CONSTRAINT "CQIReport_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CQIReport CQIReport_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CQIReport"
    ADD CONSTRAINT "CQIReport_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CourseObjective CourseObjective_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CourseObjective"
    ADD CONSTRAINT "CourseObjective_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Course Course_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CurriculumItem CurriculumItem_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CurriculumItem"
    ADD CONSTRAINT "CurriculumItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CurriculumItem CurriculumItem_curriculumId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."CurriculumItem"
    ADD CONSTRAINT "CurriculumItem_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES public."Curriculum"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Curriculum Curriculum_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Curriculum"
    ADD CONSTRAINT "Curriculum_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Group Group_planningRowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES public."PlanningRow"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Group Group_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanningRow PlanningRow_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."PlanningRow"
    ADD CONSTRAINT "PlanningRow_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanningRow PlanningRow_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."PlanningRow"
    ADD CONSTRAINT "PlanningRow_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanningRow PlanningRow_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."PlanningRow"
    ADD CONSTRAINT "PlanningRow_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Program Program_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_generatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Request Request_reviewedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Request Request_submittedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Request Request_workloadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_workloadId_fkey" FOREIGN KEY ("workloadId") REFERENCES public."WorkloadRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Room Room_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StaffUnit StaffUnit_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StaffUnit"
    ADD CONSTRAINT "StaffUnit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffUnit StaffUnit_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StaffUnit"
    ADD CONSTRAINT "StaffUnit_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentCohort StudentCohort_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StudentCohort"
    ADD CONSTRAINT "StudentCohort_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentCohort StudentCohort_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."StudentCohort"
    ADD CONSTRAINT "StudentCohort_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VacancyRecord VacancyRecord_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."VacancyRecord"
    ADD CONSTRAINT "VacancyRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VacancyRecord VacancyRecord_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."VacancyRecord"
    ADD CONSTRAINT "VacancyRecord_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WeeklySyllabus WeeklySyllabus_cqiId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WeeklySyllabus"
    ADD CONSTRAINT "WeeklySyllabus_cqiId_fkey" FOREIGN KEY ("cqiId") REFERENCES public."CQIReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkloadAssignment WorkloadAssignment_facultyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadAssignment"
    ADD CONSTRAINT "WorkloadAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkloadAssignment WorkloadAssignment_planningRowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadAssignment"
    ADD CONSTRAINT "WorkloadAssignment_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES public."PlanningRow"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkloadEditHistory WorkloadEditHistory_editedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadEditHistory"
    ADD CONSTRAINT "WorkloadEditHistory_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkloadEditHistory WorkloadEditHistory_workloadRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadEditHistory"
    ADD CONSTRAINT "WorkloadEditHistory_workloadRecordId_fkey" FOREIGN KEY ("workloadRecordId") REFERENCES public."WorkloadRecord"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WorkloadRecord WorkloadRecord_assignedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkloadRecord WorkloadRecord_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkloadRecord WorkloadRecord_facultyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkloadRecord WorkloadRecord_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Group"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkloadRecord WorkloadRecord_planningRowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_planningRowId_fkey" FOREIGN KEY ("planningRowId") REFERENCES public."PlanningRow"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WorkloadRecord WorkloadRecord_semesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: workload_user
--

ALTER TABLE ONLY public."WorkloadRecord"
    ADD CONSTRAINT "WorkloadRecord_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES public."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: workload_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict PMa54TpwN16RkoQhi9LWa9gB8ADukiOrHKoNdUBIp9IovRTcHx2MhXxlutG81JQ

