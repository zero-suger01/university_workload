// @ts-nocheck
import { z } from 'zod';

enum TeachingLanguage {
  UZB = 'UZB',
  UZB_ENG = 'UZB_ENG',
  RUS_ENG = 'RUS_ENG',
}

export const cohortSchema = z.object({
  programId: z.string().min(1),
  semesterId: z.string().min(1),
  yearOfStudy: z.number().int().min(1).max(6),
  language: z.nativeEnum(TeachingLanguage),
  studentCount: z.number().int().min(0).default(0),
  groupCodes: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const updateCohortSchema = cohortSchema.partial();
export type CohortInput = z.infer<typeof cohortSchema>;
