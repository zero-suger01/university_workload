import { z } from 'zod';
import { CourseType } from '@prisma/client';

// Will be available after prisma generate
enum DegreeLevel { BACHELOR = 'BACHELOR', MASTER = 'MASTER', PHD = 'PHD' }

export const courseSchema = z.object({
  courseCode: z.string().min(1).max(20).toUpperCase(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.nativeEnum(CourseType).optional().default('LECTURE' as CourseType),
  creditUnits: z.number().nonnegative().optional().default(3),
  weeklyHours: z.number().nonnegative().optional(),
  weeklyLectureHours: z.number().nonnegative().default(0),
  weeklyTutorialHours: z.number().nonnegative().default(0),
  weeklyLabHours: z.number().nonnegative().default(0),
  maxStudents: z.number().int().nonnegative().default(40),
  departmentId: z.string().min(1).optional(),
  responsibleDepartment: z.string().optional(),
  isActive: z.boolean().default(true),

  // Extended catalog fields
  ectsCredits: z.number().nonnegative().optional(),
  usCreditHours: z.number().nonnegative().optional(),
  subjectBoard: z.string().optional(),
  prerequisites: z.string().optional(),
  textbook: z.string().optional(),
  courseDuration: z.string().optional(),
  semesterOffered: z.string().optional(),
  degreeLevel: z.string().optional(),
  learningOutcome1: z.string().optional(),
  learningOutcome2: z.string().optional(),
  learningOutcome3: z.string().optional(),
  learningOutcome4: z.string().optional(),
  learningOutcome5: z.string().optional(),
  learningOutcome6: z.string().optional(),
  learningOutcome7: z.string().optional(),
  learningOutcome8: z.string().optional(),
  learningOutcome9: z.string().optional(),
  learningOutcome10: z.string().optional(),
  learningOutcome11: z.string().optional(),
  learningOutcome12: z.string().optional(),
  learningOutcome13: z.string().optional(),
  learningOutcome14: z.string().optional(),
  accreditationArea: z.string().optional(),
  partOfTerm: z.string().optional(),
  format: z.string().optional(),
  gradeStatus: z.string().optional(),
  seatsAvailable: z.number().int().nonnegative().optional(),
  waitlistTotal: z.number().int().nonnegative().optional(),
  lastDayToRegister: z.string().optional(),
  lastDayToAddDrop: z.string().optional(),
  instructorInfo: z.string().optional(),
  meetingInfo: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCourseSchema = courseSchema.partial();
export type CourseInput = z.infer<typeof courseSchema>;
