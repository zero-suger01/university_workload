// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { ProgramInput } from './programs.schema';

export async function getAll(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;
  const departmentId = query.departmentId as string | undefined;
  const degreeLevel = query.degreeLevel as string | undefined;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(departmentId && { departmentId }),
    ...(degreeLevel && { degreeLevel: degreeLevel as any }),
    isActive: true,
  };

  const [total, programs] = await Promise.all([
    prisma.program.count({ where }),
    prisma.program.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { groups: true, planningRows: true } },
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
  ]);

  return { programs, meta: buildMeta(total, page, limit) };
}

export async function getById(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      curricula: {
        include: {
          items: {
            include: { course: { select: { id: true, courseCode: true, title: true, ectsCredits: true } } },
            orderBy: { semesterNumber: 'asc' },
          },
        },
      },
      _count: { select: { groups: true, planningRows: true } },
    },
  });
  if (!program) throw ApiError.notFound('Program not found');
  return program;
}

export async function create(data: ProgramInput) {
  const existing = await prisma.program.findUnique({ where: { code: data.code } });
  if (existing) throw ApiError.conflict('Program code already exists');
  return prisma.program.create({
    data,
    include: { department: { select: { id: true, name: true, code: true } } },
  });
}

export async function update(id: string, data: Partial<ProgramInput>) {
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) throw ApiError.notFound('Program not found');
  return prisma.program.update({ where: { id }, data });
}

export async function remove(id: string) {
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) throw ApiError.notFound('Program not found');
  await prisma.program.update({ where: { id }, data: { isActive: false } });
}
