import { z } from 'zod';

export const createWorkloadSchema = z.object({
  facultyId: z.string().optional(),
  courseId: z.string().min(1),
  semesterId: z.string().optional().default(''),
  lectureHours: z.number().min(0).default(0),
  seminarHours: z.number().min(0).default(0),
  labHours: z.number().min(0).default(0),
  advisingHours: z.number().min(0).default(0),
  researchHours: z.number().min(0).default(0),
  adminHours: z.number().min(0).default(0),
  otherHours: z.number().min(0).default(0),
  groupCodes: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),

  // Existing Prisma fields not previously exposed
  teachingLanguage: z.enum(['UZB', 'UZB_ENG', 'RUS_ENG']).optional(),
  weekCount: z.number().int().min(0).optional(),

  // New fields
  yearOfStudy: z.array(z.number().int()).optional().default([]),
  semesterNumbers: z.array(z.number().int()).optional().default([]),
  program: z.string().optional(),
  courseType: z.enum(['optional', 'Requires', 'Both']).optional(),
  courseECTS: z.number().min(0).optional(),
  semesterECTS: z.number().min(0).optional(),
  responsibleDepartment: z.string().optional(),
  confirmedByResDept: z.boolean().optional().default(false),
  studentCount: z.number().int().min(0).optional(),
  lectureGroup: z.number().int().min(0).optional(),
  tutorialGroup: z.number().int().min(0).optional(),
  totalSmallGroup: z.number().int().min(0).optional().default(0),
  totalCoveredTutorialHours: z.number().min(0).optional().default(0),
  totalCoveredLectureHours: z.number().min(0).optional().default(0),
  totalCoveredLabHours: z.number().min(0).optional().default(0),
  uncoveredHours: z.number().optional().default(0),
  lecturesAndTutorialsNo: z.number().int().min(0).optional().default(0),
  school: z.string().optional(),

  // PlanningRow link
  planningRowId: z.string().optional(),

  // Assigned hours (professor-specific, separate from required course hours)
  assignedLectureHours: z.number().min(0).optional().default(0),
  assignedTutorialHours: z.number().min(0).optional().default(0),
  assignedLabHours: z.number().min(0).optional().default(0),
});

export const updateWorkloadSchema = z.object({
  // Allow changing all core fields (full edit mode)
  facultyId: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  semesterId: z.string().min(1).optional(),
  lectureHours: z.number().min(0).optional(),
  seminarHours: z.number().min(0).optional(),
  labHours: z.number().min(0).optional(),
  advisingHours: z.number().min(0).optional(),
  researchHours: z.number().min(0).optional(),
  adminHours: z.number().min(0).optional(),
  otherHours: z.number().min(0).optional(),
  groupCodes: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),

  // Existing Prisma fields not previously exposed
  teachingLanguage: z.enum(['UZB', 'UZB_ENG', 'RUS_ENG']).optional(),
  weekCount: z.number().int().min(0).optional(),

  // New fields
  yearOfStudy: z.array(z.number().int()).optional(),
  semesterNumbers: z.array(z.number().int()).max(2).optional(),
  program: z.string().optional(),
  courseType: z.enum(['optional', 'Requires', 'Both']).optional(),
  courseECTS: z.number().min(0).optional(),
  semesterECTS: z.number().min(0).optional(),
  responsibleDepartment: z.string().optional(),
  confirmedByResDept: z.boolean().optional(),
  studentCount: z.number().int().min(0).optional(),
  lectureGroup: z.number().int().min(0).optional(),
  tutorialGroup: z.number().int().min(0).optional(),
  totalSmallGroup: z.number().int().min(0).optional(),
  totalCoveredTutorialHours: z.number().min(0).optional(),
  totalCoveredLectureHours: z.number().min(0).optional(),
  totalCoveredLabHours: z.number().min(0).optional(),
  uncoveredHours: z.number().optional(),
  lecturesAndTutorialsNo: z.number().int().min(0).optional(),
  school: z.string().optional(),

  // PlanningRow link
  planningRowId: z.string().optional(),

  // Assigned hours (professor-specific, separate from required course hours)
  assignedLectureHours: z.number().min(0).optional(),
  assignedTutorialHours: z.number().min(0).optional(),
  assignedLabHours: z.number().min(0).optional(),
});

export type CreateWorkloadInput = z.infer<typeof createWorkloadSchema>;
export type UpdateWorkloadInput = z.infer<typeof updateWorkloadSchema>;
