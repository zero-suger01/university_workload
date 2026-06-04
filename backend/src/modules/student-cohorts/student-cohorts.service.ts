// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { CohortInput } from './student-cohorts.schema';

const include = {
  program: { select: { id: true, name: true, code: true } },
  semester: { select: { id: true, name: true, academicYear: true, term: true } },
};

export async function getAll(semesterId?: string) {
  return prisma.studentCohort.findMany({
    where: semesterId ? { semesterId } : undefined,
    include,
    orderBy: [{ yearOfStudy: 'asc' }, { language: 'asc' }],
  });
}

export async function getByProgram(programId: string, semesterId?: string) {
  return prisma.studentCohort.findMany({
    where: {
      programId,
      ...(semesterId && { semesterId }),
    },
    include,
    orderBy: [{ yearOfStudy: 'asc' }, { language: 'asc' }],
  });
}

export async function create(data: CohortInput) {
  const { programId, ...rest } = data;
  return prisma.studentCohort.create({
    data: programId ? { ...rest, programId } : rest,
    include,
  });
}

export async function update(id: string, data: Partial<CohortInput>) {
  const cohort = await prisma.studentCohort.findUnique({ where: { id } });
  if (!cohort) throw ApiError.notFound('Student cohort not found');
  return prisma.studentCohort.update({ where: { id }, data, include });
}

export async function remove(id: string) {
  const cohort = await prisma.studentCohort.findUnique({ where: { id } });
  if (!cohort) throw ApiError.notFound('Student cohort not found');
  await prisma.studentCohort.delete({ where: { id } });
}
