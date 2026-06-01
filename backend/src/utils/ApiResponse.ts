import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
