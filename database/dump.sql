--
-- PostgreSQL database dump
--

\restrict YiNcYc5LYqxsbM072IGoupE9yP9oUMNQ8keYO3khRcqUfOvIBxoIX3A4WZ9OfUt

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
    'PROFESSOR_IN_PRACTICE',
    'VISITING_PROFESSOR',
    'VISITING_FULLTIME_PROFESSOR',
    'VISITING_ASSOCIATE_PROFESSOR',
    'ADJUNCT_PROFESSOR',
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
    type public."CourseType" NOT NULL,
    "creditUnits" double precision NOT NULL,
    "weeklyHours" double precision NOT NULL,
    "weeklyLectureHours" double precision DEFAULT 0 NOT NULL,
    "weeklyTutorialHours" double precision DEFAULT 0 NOT NULL,
    "weeklyLabHours" double precision DEFAULT 0 NOT NULL,
    "maxStudents" integer DEFAULT 40 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "ectsCredits" double precision,
    "usCreditHours" double precision,
    "subjectBoard" text,
    prerequisites text,
    textbook text,
    "courseDuration" text,
    "semesterOffered" text,
    "degreeLevel" text,
    "learningOutcome1" text,
    "learningOutcome2" text,
    "learningOutcome3" text,
    "learningOutcome4" text,
    "learningOutcome5" text,
    "learningOutcome6" text,
    "learningOutcome7" text,
    "learningOutcome8" text,
    "learningOutcome9" text,
    "learningOutcome10" text,
    "learningOutcome11" text,
    "learningOutcome12" text,
    "learningOutcome13" text,
    "learningOutcome14" text,
    "syllabusTemplate" text,
    term text,
    "accreditationArea" text,
    "partOfTerm" text,
    format text,
    "gradeStatus" text,
    "seatsAvailable" integer,
    "waitlistTotal" integer,
    "lastDayToRegister" text,
    "lastDayToAddDrop" text,
    "instructorInfo" text,
    "meetingInfo" text,
    notes text,
    "departmentId" text NOT NULL,
    "responsibleDepartment" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "avgWeeklyLoad" double precision DEFAULT 30 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "totalSmallGroups" integer DEFAULT 0 NOT NULL,
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
    "confirmedByResDept" boolean DEFAULT false NOT NULL,
    status public."PlanningStatus" DEFAULT 'DRAFT'::public."PlanningStatus" NOT NULL,
    notes text,
    "courseId" text NOT NULL,
    "programId" text NOT NULL,
    "semesterId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "weekCount" integer DEFAULT 16 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "programId" text,
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
    "academicPosition" public."AcademicPosition",
    "employmentType" public."EmploymentType",
    "academicDegree" text,
    "adminPosition" text,
    gender public."Gender",
    "programId" text,
    "departmentId" text NOT NULL,
    "facultyDepartment" text,
    "tempPassword" text,
    "refreshToken" text,
    "passwordResetToken" text,
    "passwordResetExpires" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "approvalStatus" public."WorkloadApprovalStatus" DEFAULT 'PENDING'::public."WorkloadApprovalStatus" NOT NULL,
    "rejectionReason" text,
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
    "groupCodes" text[] DEFAULT ARRAY[]::text[],
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
    "totalCoveredLabHours" double precision DEFAULT 0 NOT NULL,
    "assignedLectureHours" double precision DEFAULT 0 NOT NULL,
    "assignedTutorialHours" double precision DEFAULT 0 NOT NULL,
    "assignedLabHours" double precision DEFAULT 0 NOT NULL,
    "totalNumberOfGroups" integer,
    "tutorialGroup" integer,
    "yearOfStudy" integer[],
    "lecturesAndTutorialsNo" integer DEFAULT 0 NOT NULL,
    "uncoveredHours" double precision DEFAULT 0 NOT NULL,
    "totalSmallGroup" integer DEFAULT 0 NOT NULL,
    school text
);


ALTER TABLE public."WorkloadRecord" OWNER TO workload_user;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."AuditLog" (id, action, "entityType", "entityId", "oldValues", "newValues", "ipAddress", "performedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: CLOAssessment; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."CLOAssessment" (id, "cloNumber", description, "teachingMethods", "assessmentTools", "perfHigh", "perfMedium", "perfLow", "plosHigh", "plosMedium", "plosLow", "cqiId") FROM stdin;
\.


--
-- Data for Name: CQIReport; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."CQIReport" (id, "studentCount", status, "evalMidterm", "evalFinal", "evalAssignment", textbooks, "evalQ1Answer", "evalQ2Answer", "evalQ3Answer", "evalQ4Answer", "surveyParticipation", "surveyFollowsSyllabus", "surveySatisfaction", "surveyAvgScore", "reviewNotes", "submittedAt", "approvedAt", "courseId", "semesterId", "facultyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Course" (id, "courseCode", title, description, type, "creditUnits", "weeklyHours", "weeklyLectureHours", "weeklyTutorialHours", "weeklyLabHours", "maxStudents", "isActive", "ectsCredits", "usCreditHours", "subjectBoard", prerequisites, textbook, "courseDuration", "semesterOffered", "degreeLevel", "learningOutcome1", "learningOutcome2", "learningOutcome3", "learningOutcome4", "learningOutcome5", "learningOutcome6", "learningOutcome7", "learningOutcome8", "learningOutcome9", "learningOutcome10", "learningOutcome11", "learningOutcome12", "learningOutcome13", "learningOutcome14", "syllabusTemplate", term, "accreditationArea", "partOfTerm", format, "gradeStatus", "seatsAvailable", "waitlistTotal", "lastDayToRegister", "lastDayToAddDrop", "instructorInfo", "meetingInfo", notes, "departmentId", "responsibleDepartment", "createdAt", "updatedAt") FROM stdin;
cmpzwdypx0001iov72uhtmews	HASS102	General English 1	\N	OTHER	3	6	0	6	0	40	t	8	3	Humanities and Social Sciences	None	\N	\N	Fall	BACHELOR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmpztgkfz0000evhft8zrg2u7	Department of English	2026-06-04 19:38:03.909	2026-06-04 19:39:07.37
\.


--
-- Data for Name: CourseObjective; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."CourseObjective" (id, number, description, "courseId") FROM stdin;
\.


--
-- Data for Name: Curriculum; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Curriculum" (id, name, description, "isActive", "programId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CurriculumItem; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."CurriculumItem" (id, "semesterNumber", "isRequired", "curriculumId", "courseId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Department" (id, name, code, description, "avgWeeklyLoad", "createdAt", "updatedAt") FROM stdin;
cmpztgkfz0000evhft8zrg2u7	Computer Science	CS	Computer Science Department	30	2026-06-04 18:16:06.527	2026-06-04 18:16:06.527
cmpztgo3400019v4b8u2c6gvx	Department of General Education	GEN-EDU	\N	20	2026-06-04 18:16:11.248	2026-06-04 18:16:11.248
cmpztgo3600029v4bexup07ix	Department of Education	EDU	\N	20	2026-06-04 18:16:11.25	2026-06-04 18:16:11.25
cmpztgo3700039v4b0we2smcd	Department of Mathematics	MATH-DEPT	\N	20	2026-06-04 18:16:11.252	2026-06-04 18:16:11.252
cmpztgo3900049v4b7du0pcns	Department of Information Systems and Technologies	IST	\N	20	2026-06-04 18:16:11.253	2026-06-04 18:16:11.253
cmpzukn7r0004fpb66lx1qp83	Artificial Intelligence & Robotics	AIR	\N	20	2026-06-04 18:47:16.36	2026-06-04 18:47:16.36
cmpztgo2v00009v4bfcndb4vt	Department of English	ENG-DEPT	\N	20	2026-06-04 18:16:11.239	2026-06-04 20:06:44.55
\.


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Group" (id, name, "studentCount", "groupType", "planningRowId", "programId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Notification" (id, type, title, message, "isRead", "readAt", metadata, "userId", "createdAt") FROM stdin;
cmpztj0n7001hlw35dg8k0jof	SYSTEM_ALERT	Semester Removed	Semester AY 2025-2026 Semester 1 has been removed.	f	\N	{"semesterId": "cmpztgkgh0007evhfj54rab53", "semesterName": "AY 2025-2026 Semester 1"}	cmpztgtx7001e9v4bhj1n6gkb	2026-06-04 18:18:00.836
cmpztj0n70019lw35caa59e48	SYSTEM_ALERT	Semester Removed	Semester AY 2025-2026 Semester 1 has been removed.	f	\N	{"semesterId": "cmpztgkgh0007evhfj54rab53", "semesterName": "AY 2025-2026 Semester 1"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 18:18:00.835
cmpztj0n7001flw35vg18jodq	SYSTEM_ALERT	Semester Removed	Semester AY 2025-2026 Semester 1 has been removed.	f	\N	{"semesterId": "cmpztgkgh0007evhfj54rab53", "semesterName": "AY 2025-2026 Semester 1"}	cmpztgqlc000o9v4bccbbiayk	2026-06-04 18:18:00.836
cmpztj0n7001elw35w7ozff80	SYSTEM_ALERT	Semester Removed	Semester AY 2025-2026 Semester 1 has been removed.	f	\N	{"semesterId": "cmpztgkgh0007evhfj54rab53", "semesterName": "AY 2025-2026 Semester 1"}	cmpztgrvj000y9v4bfz48qnbn	2026-06-04 18:18:00.836
cmpztj0na001jlw35tjmfivnr	SYSTEM_ALERT	Semester Removed	Semester AY 2025-2026 Semester 1 has been removed.	f	\N	{"semesterId": "cmpztgkgh0007evhfj54rab53", "semesterName": "AY 2025-2026 Semester 1"}	cmpztgl620009evhfbv16snq2	2026-06-04 18:18:00.836
cmpzv0w7n000xx749obaz0hd7	SYSTEM_ALERT	Semester Updated	Semester Fall 2026 has been updated.	f	\N	{"semesterId": "cmpzth11v0000nr3j5msjz2t5", "semesterName": "Fall 2026"}	cmpztgrvj000y9v4bfz48qnbn	2026-06-04 18:59:54.515
cmpzv0w7o000zx7490j61qlaw	SYSTEM_ALERT	Semester Updated	Semester Fall 2026 has been updated.	f	\N	{"semesterId": "cmpzth11v0000nr3j5msjz2t5", "semesterName": "Fall 2026"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 18:59:54.515
cmpzv0w7p0011x7495v6pwd8j	SYSTEM_ALERT	Semester Updated	Semester Fall 2026 has been updated.	f	\N	{"semesterId": "cmpzth11v0000nr3j5msjz2t5", "semesterName": "Fall 2026"}	cmpztgl620009evhfbv16snq2	2026-06-04 18:59:54.515
cmpzv0w7n000wx749c3biqddm	SYSTEM_ALERT	Semester Updated	Semester Fall 2026 has been updated.	f	\N	{"semesterId": "cmpzth11v0000nr3j5msjz2t5", "semesterName": "Fall 2026"}	cmpztgqlc000o9v4bccbbiayk	2026-06-04 18:59:54.515
cmpzv0w8e0013x749sk2x3a22	SYSTEM_ALERT	Semester Updated	Semester Fall 2026 has been updated.	f	\N	{"semesterId": "cmpzth11v0000nr3j5msjz2t5", "semesterName": "Fall 2026"}	cmpztgtx7001e9v4bhj1n6gkb	2026-06-04 18:59:54.515
cmpzwdyqi0004iov72drfxwsz	SYSTEM_ALERT	New Course Added	Course HASS101 — General English 1 has been added to the catalog.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS101"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 19:38:03.931
cmpzwdyqi0005iov7iw3qskph	SYSTEM_ALERT	New Course Added	Course HASS101 — General English 1 has been added to the catalog.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS101"}	cmpztgrvj000y9v4bfz48qnbn	2026-06-04 19:38:03.931
cmpzwdyrp0007iov7si7dfxj7	SYSTEM_ALERT	New Course Added	Course HASS101 — General English 1 has been added to the catalog.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS101"}	cmpztgl620009evhfbv16snq2	2026-06-04 19:38:03.931
cmpzwdyrs0009iov7jbalg6or	SYSTEM_ALERT	New Course Added	Course HASS101 — General English 1 has been added to the catalog.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS101"}	cmpztgqlc000o9v4bccbbiayk	2026-06-04 19:38:03.931
cmpzwdyrt000biov75ixl0x25	SYSTEM_ALERT	New Course Added	Course HASS101 — General English 1 has been added to the catalog.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS101"}	cmpztgtx7001e9v4bhj1n6gkb	2026-06-04 19:38:03.931
cmpzwfbp7000diov7ggmhhsgb	SYSTEM_ALERT	Course Updated	Course HASS102 — General English 1 has been updated.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS102"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 19:39:07.387
cmpzwfbp8000fiov7trktin9i	SYSTEM_ALERT	Course Updated	Course HASS102 — General English 1 has been updated.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS102"}	cmpztgrvj000y9v4bfz48qnbn	2026-06-04 19:39:07.387
cmpzwfbp9000hiov70rfxfabv	SYSTEM_ALERT	Course Updated	Course HASS102 — General English 1 has been updated.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS102"}	cmpztgl620009evhfbv16snq2	2026-06-04 19:39:07.387
cmpzwfbpa000liov7xvorpsih	SYSTEM_ALERT	Course Updated	Course HASS102 — General English 1 has been updated.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS102"}	cmpztgtx7001e9v4bhj1n6gkb	2026-06-04 19:39:07.387
cmpzwfbp9000kiov7xvws8dan	SYSTEM_ALERT	Course Updated	Course HASS102 — General English 1 has been updated.	f	\N	{"courseId": "cmpzwdypx0001iov72uhtmews", "courseCode": "HASS102"}	cmpztgqlc000o9v4bccbbiayk	2026-06-04 19:39:07.387
cmpzwi5o0000tiov7k1br4bwf	WORKLOAD_ASSIGNED	New Workload Assigned	You have been assigned to HASS102 for Fall 2026.	f	\N	{"courseCode": "HASS102", "workloadId": "cmpzwi5mx000piov79yc6rdz8", "semesterName": "Fall 2026"}	cmpztgl620009evhfbv16snq2	2026-06-04 19:41:19.536
cmpzwozqb000ziov7zw96haly	WORKLOAD_ASSIGNED	New Workload Assigned	You have been assigned to HASS102 for Fall 2026.	f	\N	{"courseCode": "HASS102", "workloadId": "cmpzwozpc000viov7xd1crs1e", "semesterName": "Fall 2026"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 19:46:38.436
cmpzwozqh0011iov70o9oo9ot	WORKLOAD_ASSIGNED	Workload Assigned by Admin	Admin assigned HASS102 to Azamat Akhmedjanov in your department for Fall 2026.	f	\N	{"courseCode": "HASS102", "workloadId": "cmpzwozpc000viov7xd1crs1e", "assignedById": "cmpztgl620009evhfbv16snq2", "semesterName": "Fall 2026"}	cmpztgobn00069v4b3jfo1ycm	2026-06-04 19:46:38.442
\.


--
-- Data for Name: PlanningRow; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."PlanningRow" (id, "yearOfStudy", "semesterNumber", "teachingLanguage", "studentCount", "groupNumbers", "lectureGroups", "tutorialGroups", "totalSmallGroups", "labGroups", "jointWith", "totalRequiredHours", "totalLecRequired", "totalTutRequired", "totalLabRequired", "totalCoveredHours", "totalLecCovered", "totalTutCovered", "totalLabCovered", "uncoveredHours", "confirmedByResDept", status, notes, "courseId", "programId", "semesterId", "createdAt", "updatedAt") FROM stdin;
cmpzwi5mi000niov7pn627534	1	1	UZB_ENG	0	\N	6	6	0	0	\N	576	0	576	0	72	0	72	0	-504	f	DRAFT	\N	cmpzwdypx0001iov72uhtmews	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 19:41:19.482	2026-06-04 19:46:38.43
\.


--
-- Data for Name: Program; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Program" (id, name, code, "degreeLevel", description, "isActive", "departmentId", "createdAt", "updatedAt") FROM stdin;
cmpztgkg90004evhf6w2l9d6w	Bachelor of Computer Science	CS-BSC	BACHELOR	\N	t	cmpztgkfz0000evhft8zrg2u7	2026-06-04 18:16:06.537	2026-06-04 18:16:06.537
cmpzukn7o0003fpb6bubb3aeo	Information Technologies	IT-BSC	BACHELOR	\N	t	cmpztgo3900049v4b7du0pcns	2026-06-04 18:47:16.356	2026-06-04 18:47:16.356
cmpzukn7u0006fpb6gaudv31s	Artificial Intelligence & Robotics	AIR-BSC	BACHELOR	\N	t	cmpzukn7r0004fpb66lx1qp83	2026-06-04 18:47:16.362	2026-06-04 18:47:16.362
cmpztgkge0006evhffdf8evrn	Mathematics	MATH-BSC	BACHELOR	\N	t	cmpztgo3700039v4b0we2smcd	2026-06-04 18:16:06.542	2026-06-04 20:06:44.536
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Report" (id, title, type, format, "fileUrl", parameters, "generatedById", "semesterId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Request" (id, type, status, subject, description, "attachmentUrl", "reviewNotes", "resolvedAt", "submittedById", "reviewedById", "workloadId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Room" (id, code, number, capacity, building, "buildingNo", "roomType", description, "isAvailable", "departmentId", "createdAt", "updatedAt") FROM stdin;
cmpzuw5jq000110d9w5alhlfn	INST-3-04	3-04	34	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.334	2026-06-04 18:56:13.334
cmpzuw5jr000210d9rgs00l2q	INST-3-05	3-05	34	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.335	2026-06-04 18:56:13.335
cmpzuw5js000310d9om5y9lzy	INST-3-06	3-06	34	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.336	2026-06-04 18:56:13.336
cmpzuw5jt000410d9kq3tbk9k	INST-3-07	3-07	34	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.338	2026-06-04 18:56:13.338
cmpzuw5ju000510d9b9lrt6al	INST-3-08	3-08	30	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.339	2026-06-04 18:56:13.339
cmpzuw5jv000610d9uq1rz9by	INST-3-10	3-10	28	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.34	2026-06-04 18:56:13.34
cmpzuw5jw000710d9aw58vi4c	SES-4-01	4-01	60	SES	2	LECTURE_HALL	Exact Sciences	t	\N	2026-06-04 18:56:13.34	2026-06-04 18:56:13.34
cmpzuw5jx000810d9184605kj	SES-4-02	4-02	60	SES	2	LECTURE_HALL	Exact Sciences	t	\N	2026-06-04 18:56:13.342	2026-06-04 18:56:13.342
cmpzuw5k0000910d9nomb12t3	SES-4-03	4-03	60	SES	2	LECTURE_HALL	Exact Sciences	t	\N	2026-06-04 18:56:13.344	2026-06-04 18:56:13.344
cmpzuw5k1000a10d9e5kokac8	SES-1-01	1-01	25	SES	2	COMPUTER_LAB	Exact Sciences	t	\N	2026-06-04 18:56:13.345	2026-06-04 18:56:13.345
cmpzuw5k2000b10d9a5zxhlg7	SES-1-02	1-02	25	SES	2	COMPUTER_LAB	Exact Sciences	t	\N	2026-06-04 18:56:13.346	2026-06-04 18:56:13.346
cmpzuw5k3000c10d95391egyy	INST-CH	CH	200	INST	1	CONFERENCE_HALL	Exact Sciences	t	\N	2026-06-04 18:56:13.347	2026-06-04 18:56:13.347
cmpzuw5jm000010d94ugzj6v3	INST-3-01	3-01	42	INST	1	SEMINAR_ROOM	Exact Sciences	t	\N	2026-06-04 18:56:13.331	2026-06-04 18:58:36.041
\.


--
-- Data for Name: Semester; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."Semester" (id, name, "academicYear", term, "startDate", "endDate", "isActive", "isCurrent", "weekCount", "createdAt", "updatedAt") FROM stdin;
cmpzth11v0000nr3j5msjz2t5	Fall 2026	2026-2027	2	2026-09-01 00:00:00	2026-06-04 00:00:00	t	t	16	2026-06-04 18:16:28.052	2026-06-04 18:59:54.501
\.


--
-- Data for Name: StaffUnit; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."StaffUnit" (id, "totalLectureHours", "totalTutorialHours", "totalLabHours", "totalSeminarHours", "ratingHours", "consultHours", "courseWorkHours", "practiceHours", "thesisHours", "totalAuditoriyaHours", "totalAllHours", "staffUnitsCount", "avgLoad", "professorCount", "docentCount", "seniorLecturerCount", "lecturerCount", "departmentId", "semesterId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StudentCohort; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."StudentCohort" (id, "yearOfStudy", language, "studentCount", "groupCodes", notes, "programId", "semesterId", "createdAt", "updatedAt") FROM stdin;
cmpzth1200002nr3jpidhxth2	1	UZB_ENG	0	{FM1}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.057	2026-06-04 18:47:16.365
cmpzth1220004nr3j0haivtxt	1	UZB_ENG	0	{FM2}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.059	2026-06-04 18:47:16.367
cmpzth1230006nr3j7alzenne	1	UZB_ENG	0	{FM3}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.06	2026-06-04 18:47:16.368
cmpzth1240008nr3j0o7k4mc7	1	UZB_ENG	0	{FM4}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.06	2026-06-04 18:47:16.37
cmpzth125000anr3joey4yhx1	1	UZB_ENG	0	{FM5}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.061	2026-06-04 18:47:16.371
cmpzth127000cnr3jltji8grt	1	UZB_ENG	0	{FM6}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:16:28.063	2026-06-04 18:47:16.371
cmpzuc6om0007x7490a9fcywi	1	RUS_ENG	25	{FM7}	\N	cmpztgkge0006evhffdf8evrn	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:40:41.658	2026-06-04 18:47:16.372
cmpzud2kl0009x7498r0cremd	1	UZB_ENG	0	{FIT1}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:41:23.013	2026-06-04 18:47:16.373
cmpzudglz000bx7495kk0fray	1	UZB_ENG	0	{FIT2}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:41:41.204	2026-06-04 18:47:16.374
cmpzudsva000dx7490e43ydcx	1	UZB_ENG	0	{FIT3}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:41:57.095	2026-06-04 18:47:16.374
cmpzue09c000fx749rsehok3k	1	UZB_ENG	0	{FIT4}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:42:06.672	2026-06-04 18:47:16.375
cmpzuef2n000hx749vlgni0tq	1	UZB_ENG	0	{FIT5}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:42:25.871	2026-06-04 18:47:16.376
cmpzuemte000jx749a4mhlvww	1	UZB_ENG	0	{FIT6}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:42:35.907	2026-06-04 18:47:16.376
cmpzuf5r8000lx749vpsw4vqb	1	RUS_ENG	0	{FIT7}	\N	cmpzukn7o0003fpb6bubb3aeo	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:43:00.452	2026-06-04 18:47:16.377
cmpzugpp6000nx749k95dsiv2	1	RUS_ENG	0	{FAR4}	\N	cmpzukn7u0006fpb6gaudv31s	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:44:12.955	2026-06-04 18:47:16.378
cmpzugyoh000px749fernp4zq	1	UZB_ENG	0	{FAR1}	\N	cmpzukn7u0006fpb6gaudv31s	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:44:24.594	2026-06-04 18:47:16.378
cmpzuh5jo000rx749vcc8ledw	1	UZB_ENG	0	{FAR2}	\N	cmpzukn7u0006fpb6gaudv31s	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:44:33.492	2026-06-04 18:47:16.379
cmpzuhe85000tx749k2n7mfod	1	UZB_ENG	0	{FAR3}	\N	cmpzukn7u0006fpb6gaudv31s	cmpzth11v0000nr3j5msjz2t5	2026-06-04 18:44:44.742	2026-06-04 18:51:24.33
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."User" (id, "employeeId", email, "passwordHash", "firstName", "lastName", role, "profilePhoto", "phoneNumber", "isActive", "maxWeeklyHours", "minWeeklyHours", "academicPosition", "employmentType", "academicDegree", "adminPosition", gender, "programId", "departmentId", "facultyDepartment", "tempPassword", "refreshToken", "passwordResetToken", "passwordResetExpires", "createdAt", "updatedAt") FROM stdin;
cmpztgqty000q9v4bqo6e2mha	F250015	a.suleymanova@npuu.uz	$2a$12$dzbY2LvRkJLMDQDaMbh7OuKi0k8OP3C.3vLZnVRbCyJCkWIGBUAiS	Albina	Suleymanova	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo3600029v4bexup07ix	Department of Education	\N	\N	\N	\N	2026-06-04 18:16:14.806	2026-06-04 18:16:14.806
cmpztgr3y000s9v4bwymdrxbi	F250016	o.shukurillaeva@npuu.uz	$2a$12$R5KLHlxKQ9/f12EYiU4Sju/f.Ax2H3SzX1s79b8YgbeXsO6de30py	Ozodakhon	Shukurillaeva	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo3600029v4bexup07ix	Department of Education	\N	\N	\N	\N	2026-06-04 18:16:15.166	2026-06-04 18:16:15.166
cmpztgrde000u9v4baxz6hqi8	F250017	m.khidoyatov@npuu.uz	$2a$12$fMVdxT/Wjnkbw2BjnIrj9OH97YfpQKqd9JfxFdSNu5zeiVElfGGvq	Mirjon	Khidoyatov	FACULTY	\N	\N	t	20	6	SENIOR_LECTURER	PART_TIME	\N	\N	MALE	\N	cmpztgo3600029v4bexup07ix	Department of Education	\N	\N	\N	\N	2026-06-04 18:16:15.506	2026-06-04 18:16:15.506
cmpztgrmx000w9v4bjguzd6po	F250018	m.abdurakhmonov@npuu.uz	$2a$12$Qa9CFWwEQTwXwaEPOfZZCuTddH.Jpo4Sf4WqX1nszmc3MtTD8ZpJS	Mirsaid	Abduraxmanov	FACULTY	\N	\N	t	20	6	LECTURER	PART_TIME	\N	\N	MALE	\N	cmpztgo3600029v4bexup07ix	Department of Education	\N	\N	\N	\N	2026-06-04 18:16:15.849	2026-06-04 18:16:15.849
cmpztgs4500109v4bl73ic7q1	F250022	sh.suvanov@npuu.uz	$2a$12$EDeuVJm.AgaTHcXhe2qSt.j3HRsCQEs8MCE/g2tk6AsqHYPGhXmLe	Shakhzod	Suvanov	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	FULL_TIME	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:16.469	2026-06-04 18:16:16.469
cmpztgscv00129v4bdmkm0zlv	F250023	a.qudaybergenov@npuu.uz	$2a$12$36WcJ6IHMeuR4Dsfw9u0MegeAqb6XfkzIvemMnPjWZmEjObISxRpq	Allambergen	Qudaybergenov	FACULTY	\N	\N	t	40	12	ASSOCIATE_PROFESSOR	FULL_TIME	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:16.784	2026-06-04 18:16:16.784
cmpztgsme00149v4ban44fqnd	F250024	z.ibragimov@npuu.uz	$2a$12$Do7ie9b/c6uQx5BXR8D9sOu8Is3kbA5yYSp5l9KvejcJJFJ6joCjy	Zarif	Ibragimov	FACULTY	\N	\N	t	20	6	ASSOCIATE_PROFESSOR	PART_TIME	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:17.126	2026-06-04 18:16:17.126
cmpztgqlc000o9v4bccbbiayk	F250014	n.tillayeva@npuu.uz	$2a$12$nUv2ep7SbczdDVbQ6lX59.Z0G7hkd75La2k5.AL3mPW9QPlPiiJ/O	Nilufar	Tillayeva	DEPARTMENT_HEAD	\N	\N	t	40	12	HEAD_OF_DEPARTMENT	FULL_TIME	\N	Head of Department	FEMALE	\N	cmpztgo3600029v4bexup07ix	Department of Education	\N	\N	\N	\N	2026-06-04 18:16:14.496	2026-06-04 19:04:32.221
cmpztgrvj000y9v4bfz48qnbn	F250021	m.ruziboev@npuu.uz	$2a$12$DyFRB3AIgtcw28gmVwimMu4yLK42div7yIc2pdwTD6uFRoy/Ip/pK	Marks	Ruziboev	DEPARTMENT_HEAD	\N	\N	t	40	12	HEAD_OF_DEPARTMENT	FULL_TIME	\N	Head of Department	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:16.159	2026-06-04 19:04:32.221
cmpztgsx700169v4bndduxry8	F250025	b.juraev@npuu.uz	$2a$12$bAXS5MVZ0b2a5/SOk3ESDOKi3zT9GTVYYMifOQEOpnNbiGVT9KVqO	Baxtinur	Juraev	FACULTY	\N	\N	t	40	12	LECTURER	\N	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:17.516	2026-06-04 19:07:18.088
cmpztgt6n00189v4byzot1tax	F250026	a.sadullayev@npuu.uz	$2a$12$mwNLFJFQ5q7OxYZnbWcH6O9bgxsynJW210BXdlZNtgu.mVbaHJcay	Anvar	Sa'dullayev	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	\N	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:17.855	2026-06-04 19:07:18.088
cmpztgtf2001a9v4blxe2zbqj	F250027	f.muxamadiyev@npuu.uz	$2a$12$KgbkljiRNZEptNNoetZlHOUCQ1LEE38QtOcqVHAayvroYkE39jiF.	Farxod	Muxammadiyev	FACULTY	\N	\N	t	40	12	ASSOCIATE_PROFESSOR	\N	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:18.158	2026-06-04 19:07:18.088
cmpztgtn7001c9v4bsc5brcf0	F250028	a.xolboyev@npuu.uz	$2a$12$cEB.PBlSJ6WTuhfnFTGPXO5Rl26PNEG15S6mNM4dYujIy8reJvG0e	Azamat	Holboev	FACULTY	\N	\N	t	40	12	ASSOCIATE_PROFESSOR	\N	\N	\N	MALE	\N	cmpztgo3700039v4b0we2smcd	Department of Mathematics	\N	\N	\N	\N	2026-06-04 18:16:18.451	2026-06-04 19:07:18.088
cmpztgojo00089v4biojsrko1	F250003	a.ziyodullaeva@npuu.uz	$2a$12$5Y4u6zAtlVQ4GID/rXXR/Oe1ZeARgDFGZHQh2jYivhSqluuXrQowG	Azizabonu	Ziyodullaeva	FACULTY	\N	\N	t	40	12	LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo2v00009v4bfcndb4vt	Department of English	\N	\N	\N	\N	2026-06-04 18:16:11.845	2026-06-04 19:44:47.782
cmpztgors000a9v4bz73pjquf	F250004	r.khikmatova@npuu.uz	$2a$12$lF.mMbFD8C6H7ckKtrTqi.tJqYRY49shp697TeLd78ZqnLNvOSIGm	Rano	Khikmatova	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo2v00009v4bfcndb4vt	Department of English	\N	\N	\N	\N	2026-06-04 18:16:12.136	2026-06-04 19:44:47.782
cmpztgp0c000c9v4bt8mzl3ik	F250005	z.khakimova@npuu.uz	$2a$12$vBTbyMLkdO.hNjjIJXgl6.J/UTlujz.M8RnJZY5VeZZEEMFuwGOr6	Zukhra	Khakimova	FACULTY	\N	\N	t	40	12	SENIOR_LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo2v00009v4bfcndb4vt	Department of English	\N	\N	\N	\N	2026-06-04 18:16:12.445	2026-06-04 19:44:47.782
cmpztgp8o000e9v4bkbk37083	F250006	d.boymirzayeva@npuu.uz	$2a$12$eWqpP49hTEeUwnOiLgRlCu01rbNEIA.WOw6.vAqkdBXzM/WtYxJlm	Dilnozakhon	Boymirzayeva	FACULTY	\N	\N	t	40	12	LECTURER	FULL_TIME	\N	\N	FEMALE	\N	cmpztgo2v00009v4bfcndb4vt	Department of English	\N	\N	\N	\N	2026-06-04 18:16:12.744	2026-06-04 19:44:47.782
cmpztgobn00069v4b3jfo1ycm	F250002	a.akhmedjanov@npuu.uz	$2a$12$.YNWDqEiPM7jTtIlgF9gLePb56IhmWESDq29n9cUbg54iApvjscoa	Azamat	Akhmedjanov	DEPARTMENT_HEAD	\N	\N	t	40	12	HEAD_OF_DEPARTMENT	FULL_TIME	\N	Head of Department	MALE	\N	cmpztgo2v00009v4bfcndb4vt	Department of English	\N	\N	\N	\N	2026-06-04 18:16:11.555	2026-06-04 19:44:47.782
cmpztgu61001g9v4b0xf5nb5z	F250033	b.tulkinov@npuu.uz	$2a$12$15kFKRQmgiY..lmH5d/EE.nOPvwswqz8Lwqkifa3oEeLvkDgaQyWq	Bakhromjon	Tulkinov	FACULTY	\N	\N	t	40	12	LECTURER	FULL_TIME	\N	\N	MALE	\N	cmpztgo3900049v4b7du0pcns	Department of Information Systems and Technologies	\N	\N	\N	\N	2026-06-04 18:16:19.129	2026-06-04 18:16:19.129
cmpztgued001i9v4b19ga9e4k	F250034	u.tursunaliev@npuu.uz	$2a$12$jAwH986ZzgcangNx3Xu09Ow9OAO51xw0MJBQ./kuvzLjO6mIL.y0e	Ulug'bek	Tursunboyev	FACULTY	\N	\N	t	40	12	LECTURER	FULL_TIME	\N	\N	MALE	\N	cmpztgo3900049v4b7du0pcns	Department of Information Systems and Technologies	\N	\N	\N	\N	2026-06-04 18:16:19.429	2026-06-04 18:16:19.429
cmpztgumd001k9v4byn4zgran	F250035	m.khaydarov@npuu.uz	$2a$12$qQwCv065oYWiigN1gTtXNuOr7cJ2SX7KYI7SMxlXQvFsR0s2PHtOy	Mirraxmon	Haydarov	FACULTY	\N	\N	t	20	6	LECTURER	PART_TIME	\N	\N	MALE	\N	cmpztgo3900049v4b7du0pcns	Department of Information Systems and Technologies	\N	\N	\N	\N	2026-06-04 18:16:19.717	2026-06-04 18:16:19.717
cmpztgl620009evhfbv16snq2	EMP001	admin@university.edu	$2a$12$AUvMkj/ygjXoxvaMs81i2O20UKOcWXqnnKu8EKNM0CEYEk1h0p/Ni	System	Admin	ADMIN	\N	\N	t	40	0	\N	FULL_TIME	\N	\N	\N	\N	cmpztgkfz0000evhft8zrg2u7	\N	\N	$2a$10$tfusXC2EAwtPBu5y/nJJ8O0HDsHbFHHHGRNyNdwk3jnm09WG94P.O	\N	\N	2026-06-04 18:16:07.467	2026-06-04 20:04:27.555
cmpztgtx7001e9v4bhj1n6gkb	F250032	a.ashurov@npuu.uz	$2a$12$rIcmUwNNTu7c92QEQZdh/.GPkOpGTnPVzCsYP2NlPzKXUPEHQ6pwS	Asadullo	Ashurov	DEPARTMENT_HEAD	\N	\N	t	40	12	HEAD_OF_DEPARTMENT	FULL_TIME	\N	Head of Department	MALE	\N	cmpztgo3900049v4b7du0pcns	Department of Information Systems and Technologies	\N	\N	\N	\N	2026-06-04 18:16:18.811	2026-06-04 19:04:32.221
\.


--
-- Data for Name: VacancyRecord; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."VacancyRecord" (id, "totalRequired", "totalCovered", "uncoveredHours", "staffNeeded", "avgLoadUsed", "departmentId", "semesterId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WeeklySyllabus; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."WeeklySyllabus" (id, week, date, topic, tutorials, "cqiId") FROM stdin;
\.


--
-- Data for Name: WorkloadAssignment; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."WorkloadAssignment" (id, "assignType", "groupsCount", "hoursPerWeek", "totalHours", notes, "planningRowId", "facultyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WorkloadEditHistory; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."WorkloadEditHistory" (id, "workloadRecordId", "editedById", "editedByRole", "editedAt") FROM stdin;
cmpzwi5nu000riov7mi0pejhm	cmpzwi5mx000piov79yc6rdz8	cmpztgl620009evhfbv16snq2	ADMIN	2026-06-04 19:41:19.531
cmpzwozq9000xiov7xp2ej6g8	cmpzwozpc000viov7xd1crs1e	cmpztgl620009evhfbv16snq2	ADMIN	2026-06-04 19:46:38.433
\.


--
-- Data for Name: WorkloadRecord; Type: TABLE DATA; Schema: public; Owner: workload_user
--

COPY public."WorkloadRecord" (id, "totalHours", status, "approvalStatus", "rejectionReason", notes, "isOverloaded", "isUnderloaded", "facultyId", "courseId", "semesterId", "lectureHours", "seminarHours", "labHours", "advisingHours", "researchHours", "adminHours", "otherHours", "assignedById", "assignedAt", "createdAt", "updatedAt", "groupId", "hoursPerWeek", "planningRowId", "studentCount", "teachingLanguage", "weekCount", "groupCodes", "confirmedByResDept", "courseECTS", "courseType", "groupNumbers", "lectureGroup", program, "responsibleDepartment", "semesterECTS", "semesterNumbers", "totalCoveredLectureHours", "totalCoveredTutorialHours", "totalCoveredLabHours", "assignedLectureHours", "assignedTutorialHours", "assignedLabHours", "totalNumberOfGroups", "tutorialGroup", "yearOfStudy", "lecturesAndTutorialsNo", "uncoveredHours", "totalSmallGroup", school) FROM stdin;
cmpzwozpc000viov7xd1crs1e	216	ACTIVE	PENDING	\N	\N	t	f	cmpztgobn00069v4b3jfo1ycm	cmpzwdypx0001iov72uhtmews	cmpzth11v0000nr3j5msjz2t5	0	36	0	0	0	0	0	cmpztgl620009evhfbv16snq2	2026-06-04 19:46:38.401	2026-06-04 19:46:38.401	2026-06-04 19:46:38.446	\N	0	cmpzwi5mi000niov7pn627534	150	UZB_ENG	16	{FM1,FM2,FM3,FM4,FM5,FM6}	f	8	Requires	\N	6	Mathematics	Department of English	8	{1}	0	1	0	0	1	0	\N	6	{1}	36	-35	6	16 weeks
cmpzwi5mx000piov79yc6rdz8	216	ACTIVE	PENDING	\N	\N	t	f	cmpztgl620009evhfbv16snq2	cmpzwdypx0001iov72uhtmews	cmpzth11v0000nr3j5msjz2t5	0	36	0	0	0	0	0	cmpztgl620009evhfbv16snq2	2026-06-04 19:41:19.497	2026-06-04 19:41:19.497	2026-06-04 19:46:38.446	\N	0	cmpzwi5mi000niov7pn627534	150	UZB_ENG	16	{FM1,FM2,FM3,FM4,FM5,FM6}	f	8	Requires	\N	6	Mathematics	Department of English	8	{1}	0	1	0	0	0	0	\N	6	{1}	36	-35	6	16 weeks
\.


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
-- Name: StudentCohort_semesterId_idx; Type: INDEX; Schema: public; Owner: workload_user
--

CREATE INDEX "StudentCohort_semesterId_idx" ON public."StudentCohort" USING btree ("semesterId");


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
    ADD CONSTRAINT "StudentCohort_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

\unrestrict YiNcYc5LYqxsbM072IGoupE9yP9oUMNQ8keYO3khRcqUfOvIBxoIX3A4WZ9OfUt

