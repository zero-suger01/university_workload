import { z } from 'zod';
import { RequestType } from '@prisma/client';

export const createRequestSchema = z.object({
  type: z.nativeEnum(RequestType),
  subject: z.string().min(1).max(200),
  description: z.string().min(10),
  workloadId: z.string().optional(),
});

export const reviewRequestSchema = z.object({
  reviewNotes: z.string().min(1, 'Review notes are required'),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
