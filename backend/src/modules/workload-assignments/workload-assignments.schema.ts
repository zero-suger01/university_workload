// @ts-nocheck
import { z } from 'zod';

enum AssignType {
  LECTURE = 'LECTURE',
  TUTORIAL = 'TUTORIAL',
  LAB = 'LAB',
}

export const assignmentSchema = z.object({
  planningRowId: z.string().min(1),
  facultyId: z.string().min(1),
  assignType: z.nativeEnum(AssignType),
  groupsCount: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const updateAssignmentSchema = assignmentSchema.partial();
