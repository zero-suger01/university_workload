// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import type { PlanningRowInput } from './planning.schema';
import { recalculatePlanningRow } from '../workload-assignments/workload-assignments.service';

async function recalcRowHours(planningRowId: string) {
  const row = await prisma.planningRow.findUnique({
    where: { id: planningRowId },
    include: { course: true, semester: true },
  });
  if (!row) return;
  const wc = row.semester.weekCount;
  const totalLecRequired = (row.course.weeklyLectureHours || 0) * row.lectureGroups * wc;
  const totalTutRequired = (row.course.weeklyTutorialHours || 0) * row.tutorialGroups * wc;
  const totalLabRequired = (row.course.weeklyLabHours || 0) * row.labGroups * wc;
  const totalRequiredHours = totalLecRequired + totalTutRequired + totalLabRequired;
  await prisma.planningRow.update({
    where: { id: planningRowId },
    data: { totalLecRequired, totalTutRequired, totalLabRequired, totalRequiredHours },
  });
}

export async function getAll(
  query: Record<string, unknown>,
  user?: { userId: string; role: string; departmentId: string },
) {
  const { page, limit, skip } = parsePagination(query);
  const semesterId = query.semesterId as string | undefined;
  const programId = query.programId as string | undefined;
  const status = query.status as string | undefined;

  // DEPARTMENT_HEAD always sees only their own department's planning rows
  const departmentId =
    user?.role === 'DEPARTMENT_HEAD'
      ? user.departmentId
      : (query.departmentId as string | undefined);

  const where = {
    ...(semesterId && { semesterId }),
    ...(programId && { programId }),
    ...(status && { status: status as any }),
    ...(departmentId && { course: { departmentId } }),
  };

  const [total, rows] = await Promise.all([
    prisma.planningRow.count({ where }),
    prisma.planningRow.findMany({
      where,
      include: {
        course: { select: { id: true, courseCode: true, title: true, type: true, ectsCredits: true, weeklyHours: true, weeklyLectureHours: true, weeklyTutorialHours: true, weeklyLabHours: true, department: { select: { name: true } } } },
        program: { select: { id: true, name: true, code: true, degreeLevel: true } },
        semester: { select: { id: true, name: true, academicYear: true, term: true, weekCount: true } },
        groups: { select: { id: true, name: true, studentCount: true, groupType: true } },
        _count: { select: { workloadRecords: true } },
      },
      skip,
      take: limit,
      orderBy: [{ yearOfStudy: 'asc' }, { semesterNumber: 'asc' }],
    }),
  ]);

  return { rows, meta: buildMeta(total, page, limit) };
}

export async function getById(id: string) {
  const row = await prisma.planningRow.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, courseCode: true, title: true, type: true, ectsCredits: true, weeklyHours: true } },
      program: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true, academicYear: true, term: true, weekCount: true } },
      groups: true,
      workloadRecords: {
        include: {
          faculty: { select: { id: true, firstName: true, lastName: true, academicPosition: true } },
        },
      },
    },
  });
  if (!row) throw ApiError.notFound('Planning row not found');
  return row;
}

export async function create(data: PlanningRowInput) {
  const row = await prisma.planningRow.create({
    data,
    include: {
      course: { select: { id: true, courseCode: true, title: true, weeklyHours: true } },
      program: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true, weekCount: true } },
    },
  });

  // Auto-calculate required and covered/uncovered hours after create
  await recalcRowHours(row.id);
  await recalculatePlanningRow(row.id);
  return row;
}

export async function update(id: string, data: Partial<PlanningRowInput>) {
  const row = await prisma.planningRow.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound('Planning row not found');
  const updated = await prisma.planningRow.update({ where: { id }, data });
  await recalcRowHours(id);
  return updated;
}

export async function remove(id: string) {
  const row = await prisma.planningRow.findUnique({ where: { id } });
  if (!row) throw ApiError.notFound('Planning row not found');
  await prisma.planningRow.delete({ where: { id } });
}


export async function getSummaryBySemester(semesterId: string) {
  const rows = await prisma.planningRow.findMany({
    where: { semesterId },
    include: {
      course: { select: { departmentId: true, weeklyHours: true } },
      program: { select: { name: true } },
    },
  });

  const totalRequired = rows.reduce((sum, r) => sum + r.totalRequiredHours, 0);
  const totalCovered = rows.reduce((sum, r) => sum + r.totalCoveredHours, 0);
  const totalUncovered = rows.reduce((sum, r) => sum + r.uncoveredHours, 0);

  return {
    semesterId,
    totalRows: rows.length,
    totalRequired,
    totalCovered,
    totalUncovered,
    coveragePercent: totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0,
  };
}
