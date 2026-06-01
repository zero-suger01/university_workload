import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10).toUpperCase(),
  description: z.string().optional(),
  // Teaching load norm for this department (hours/week per full-time staff)
  // Used in vacancy forecasting: staffNeeded = ceil(uncoveredHrs / (avgWeeklyLoad × weekCount))
  avgWeeklyLoad: z.number().min(1).max(60).default(30).optional(),
});

export const updateDepartmentSchema = departmentSchema.partial();

export type DepartmentInput = z.infer<typeof departmentSchema>;
