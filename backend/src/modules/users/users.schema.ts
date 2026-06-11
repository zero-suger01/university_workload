import { z } from 'zod';
import { Role, AcademicPosition, EmploymentType } from '@prisma/client';

export const createUserSchema = z.object({
  employeeId: z.string().min(1),
  email: z.string().email(),
  // Optional — backend auto-generates a secure password if omitted
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role),
  departmentId: z.string().min(1).optional(),
  facultyDepartment: z.string().optional(),
  phoneNumber: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional().nullable(),
  academicPosition: z.nativeEnum(AcademicPosition).optional().nullable(),
  employmentType: z.nativeEnum(EmploymentType).optional().nullable(),
  programId: z.string().optional().nullable(),
  maxWeeklyHours: z.number().int().min(1).max(80).default(40),
  minWeeklyHours: z.number().int().min(0).max(40).default(12),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true, employeeId: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    // Optional — when provided, resets the user's password (and Password Directory entry)
    password: z.string().min(8).optional(),
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
