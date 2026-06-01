import { z } from 'zod';

// Will be available after prisma generate
enum TeachingLanguage { UZB = 'UZB', UZB_ENG = 'UZB_ENG', RUS_ENG = 'RUS_ENG' }
enum PlanningStatus { DRAFT = 'DRAFT', CONFIRMED = 'CONFIRMED', PUBLISHED = 'PUBLISHED' }

export const planningRowSchema = z.object({
  courseId: z.string().min(1),
  programId: z.string().min(1),
  semesterId: z.string().min(1),
  yearOfStudy: z.number().int().min(1).max(6),
  semesterNumber: z.number().int().min(1).max(12),
  teachingLanguage: z.nativeEnum(TeachingLanguage).default(TeachingLanguage.UZB),
  studentCount: z.number().int().min(0).default(0),
  lectureGroups: z.number().int().min(0).default(1),
  tutorialGroups: z.number().int().min(0).default(1),
  totalSmallGroups: z.number().int().min(0).default(0),
  labGroups: z.number().int().min(0).default(0),
  jointWith: z.string().optional(),
  notes: z.string().optional(),
  confirmedByResDept: z.boolean().optional(),
  status: z.nativeEnum(PlanningStatus).default(PlanningStatus.DRAFT),
});

export const updatePlanningRowSchema = planningRowSchema.partial();
export type PlanningRowInput = z.infer<typeof planningRowSchema>;
