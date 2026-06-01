import { z } from 'zod';

export const curriculumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  programId: z.string().min(1),
});

export const curriculumItemSchema = z.object({
  curriculumId: z.string().min(1),
  courseId: z.string().min(1),
  semesterNumber: z.number().int().min(1).max(12),
  isRequired: z.boolean().default(true),
});

export const updateCurriculumSchema = curriculumSchema.partial();
export type CurriculumInput = z.infer<typeof curriculumSchema>;
export type CurriculumItemInput = z.infer<typeof curriculumItemSchema>;
