import { z } from 'zod';

export const generateReportSchema = z.object({
  title: z.string().min(1),
  type: z.enum([
    'workload_summary',
    'overload',
    'department_comparison',
    'kafedra_yuklama',
    'shtat_birligi',
    'vacancy_forecast',
    'password_directory',
  ]),
  format: z.enum(['pdf', 'excel']),
  semesterId: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  departmentId: z.string().optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
