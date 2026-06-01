// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { CurriculumInput, CurriculumItemInput } from './curriculum.schema';

export async function getAll(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const programId = query.programId as string | undefined;

  const where = { ...(programId && { programId }), isActive: true };

  const [total, curricula] = await Promise.all([
    prisma.curriculum.count({ where }),
    prisma.curriculum.findMany({
      where,
      include: {
        program: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
  ]);

  return { curricula, meta: buildMeta(total, page, limit) };
}

export async function getById(id: string) {
  const curriculum = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, code: true, degreeLevel: true } },
      items: {
        include: {
          course: {
            select: {
              id: true, courseCode: true, title: true, type: true,
              ectsCredits: true, usCreditHours: true, weeklyHours: true,
            },
          },
        },
        orderBy: [{ semesterNumber: 'asc' }, { course: { courseCode: 'asc' } }],
      },
    },
  });
  if (!curriculum) throw ApiError.notFound('Curriculum not found');
  return curriculum;
}

export async function create(data: CurriculumInput) {
  return prisma.curriculum.create({
    data,
    include: { program: { select: { id: true, name: true, code: true } } },
  });
}

export async function update(id: string, data: Partial<CurriculumInput>) {
  const curr = await prisma.curriculum.findUnique({ where: { id } });
  if (!curr) throw ApiError.notFound('Curriculum not found');
  return prisma.curriculum.update({ where: { id }, data });
}

export async function remove(id: string) {
  const curr = await prisma.curriculum.findUnique({ where: { id } });
  if (!curr) throw ApiError.notFound('Curriculum not found');
  await prisma.curriculum.update({ where: { id }, data: { isActive: false } });
}

export async function addItem(data: CurriculumItemInput) {
  const existing = await prisma.curriculumItem.findUnique({
    where: {
      curriculumId_courseId_semesterNumber: {
        curriculumId: data.curriculumId,
        courseId: data.courseId,
        semesterNumber: data.semesterNumber,
      },
    },
  });
  if (existing) throw ApiError.conflict('Course already in this semester');
  return prisma.curriculumItem.create({
    data,
    include: {
      course: { select: { id: true, courseCode: true, title: true, ectsCredits: true } },
    },
  });
}

export async function removeItem(itemId: string) {
  const item = await prisma.curriculumItem.findUnique({ where: { id: itemId } });
  if (!item) throw ApiError.notFound('Curriculum item not found');
  await prisma.curriculumItem.delete({ where: { id: itemId } });
}
