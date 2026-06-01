import { z } from 'zod';

export const semesterSchema = z.object({
  name: z.string().min(1),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  term: z.number().int().min(1).max(3),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateSemesterSchema = semesterSchema.partial();
export type SemesterInput = z.infer<typeof semesterSchema>;
