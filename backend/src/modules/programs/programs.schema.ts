import { z } from 'zod';

// Will be available after prisma generate
enum DegreeLevel { BACHELOR = 'BACHELOR', MASTER = 'MASTER', PHD = 'PHD' }

export const programSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20).toUpperCase(),
  degreeLevel: z.nativeEnum(DegreeLevel).default(DegreeLevel.BACHELOR),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  departmentId: z.string().min(1),
});

export const updateProgramSchema = programSchema.partial();
export type ProgramInput = z.infer<typeof programSchema>;
