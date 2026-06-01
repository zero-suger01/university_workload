import { z } from 'zod';

export const groupSchema = z.object({
  name: z.string().min(1).max(20),
  studentCount: z.number().int().min(0).default(0),
  groupType: z.enum(['LECTURE', 'TUTORIAL', 'LAB']).default('TUTORIAL'),
  planningRowId: z.string().min(1),
  programId: z.string().min(1),
});

export const updateGroupSchema = groupSchema.partial();
export type GroupInput = z.infer<typeof groupSchema>;
