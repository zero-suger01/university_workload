import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Known API errors
  if (err instanceof ApiError) {
    const body: Record<string, unknown> = { success: false, message: err.message, code: err.code };
    if (err.details !== undefined) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  // Prisma known request errors (DB constraint violations etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
      return res.status(409).json({
        success: false,
        message: `This record already exists (${fields}). Please update the existing entry instead.`,
        code: 'CONFLICT',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'This record is referenced by other data and cannot be deleted. Please remove related records first.',
        code: 'CONFLICT',
      });
    }
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}
