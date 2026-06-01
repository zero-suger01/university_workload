import { CONSTANTS } from '../config/constants';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10));
  const limit = Math.min(
    CONSTANTS.PAGINATION_MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit ?? String(CONSTANTS.PAGINATION_DEFAULT_LIMIT)), 10)),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function buildMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
