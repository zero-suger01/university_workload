import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { AuthUser } from '../../middleware/authenticate';
import { expireEndedSemesters, getLastEndedSemester } from '../semesters/semesters.service';

export async function getSummary(user: AuthUser, query: Record<string, unknown> = {}) {
  const deptFilter = user.role === Role.DEPARTMENT_HEAD ? { departmentId: user.departmentId } : {};

  await expireEndedSemesters();
  const activeSemester = await prisma.semester.findFirst({ where: { isCurrent: true } });
  const lastEndedSemester = activeSemester ? null : await getLastEndedSemester();

  // Optionally view a past (or any specific) semester instead of the active one
  const requestedId = query.semesterId as string | undefined;
  let viewSemester = activeSemester;
  if (requestedId) {
    viewSemester = await prisma.semester.findUnique({ where: { id: requestedId } });
    if (!viewSemester) throw ApiError.notFound('Semester not found');
  }

  const [totalFaculty, totalCourses, pendingRequests, facultyWorkloads] = await Promise.all([
    prisma.user.count({ where: { role: Role.FACULTY, isActive: true, ...deptFilter } }),
    prisma.course.count({ where: { isActive: true, ...deptFilter } }),
    prisma.request.count({
      where: {
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
        ...(user.role === Role.DEPARTMENT_HEAD && {
          submittedBy: { departmentId: user.departmentId },
        }),
      },
    }),
    // Count overloaded/underloaded per faculty (not per record).
    // Only meaningful within one semester — when none is active, skip the
    // query instead of summing hours across every semester combined.
    viewSemester
      ? prisma.user.findMany({
          where: { role: Role.FACULTY, isActive: true, ...deptFilter },
          select: {
            maxWeeklyHours: true,
            minWeeklyHours: true,
            workloadRecords: {
              where: {
                status: { not: 'CANCELLED' },
                semesterId: viewSemester.id,
              },
              select: { totalHours: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  let overloadedCount = 0;
  let underloadedCount = 0;
  for (const f of facultyWorkloads) {
    const total = f.workloadRecords.reduce((s, r) => s + r.totalHours, 0);
    if (total > 0 && total > f.maxWeeklyHours) overloadedCount++;
    else if (total < f.minWeeklyHours) underloadedCount++;
  }

  return { totalFaculty, totalCourses, pendingRequests, overloadedCount, underloadedCount, activeSemester, viewSemester, lastEndedSemester };
}

export async function getWorkloadDistribution(user: AuthUser, query: Record<string, unknown>) {
  const semesterId = query.semesterId as string | undefined;
  if (!semesterId) throw ApiError.badRequest('semesterId is required');

  const where: Record<string, unknown> = { semesterId };
  if (user.role === Role.DEPARTMENT_HEAD) {
    where.faculty = { departmentId: user.departmentId };
  }

  const records = await prisma.workloadRecord.findMany({
    where,
    include: {
      faculty: {
        select: {
          id: true, firstName: true, lastName: true,
          maxWeeklyHours: true, minWeeklyHours: true,
          departmentId: true, gender: true,
          academicPosition: true, employmentType: true,
        },
      },
    },
  });

  const grouped = new Map<string, {
    name: string; totalHours: number; maxHours: number; minHours: number;
    departmentId: string; gender: string | null;
    academicPosition: string | null; employmentType: string;
  }>();
  for (const r of records) {
    const key = r.facultyId;
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: `${r.faculty.firstName} ${r.faculty.lastName}`,
        totalHours: 0,
        maxHours: r.faculty.maxWeeklyHours,
        minHours: r.faculty.minWeeklyHours,
        departmentId: r.faculty.departmentId,
        gender: r.faculty.gender,
        academicPosition: r.faculty.academicPosition,
        employmentType: r.faculty.employmentType,
      });
    }
    grouped.get(key)!.totalHours += r.totalHours;
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalHours - a.totalHours);
}

export async function getDepartmentComparison(query: Record<string, unknown>) {
  const semesterId = query.semesterId as string | undefined;
  if (!semesterId) throw ApiError.badRequest('semesterId is required');

  const departments = await prisma.department.findMany({
    include: {
      users: {
        where: { role: Role.FACULTY, isActive: true },
        include: {
          workloadRecords: {
            where: { semesterId },
            select: { totalHours: true },
          },
        },
      },
    },
  });

  return departments.map((dept) => {
    const facultyCount = dept.users.length;
    const totalHours = dept.users.reduce(
      (s, u) => s + u.workloadRecords.reduce((ss, w) => ss + w.totalHours, 0),
      0,
    );
    return {
      department: { id: dept.id, name: dept.name, code: dept.code },
      facultyCount,
      totalHours,
      avgHours: facultyCount > 0 ? totalHours / facultyCount : 0,
    };
  });
}
