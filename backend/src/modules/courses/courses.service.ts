import { CourseType, DegreeLevel, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { createNotification } from '../notifications/notifications.service';
import type { CourseInput } from './courses.schema';

export async function getAll(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;
  const type = query.type as CourseType | undefined;
  const departmentId = query.departmentId as string | undefined;

  const isActiveParam = query.isActive as string | undefined;
  let isActive: boolean | undefined;
  if (isActiveParam === 'true') isActive = true;
  else if (isActiveParam === 'false') isActive = false;

  const where: any = {
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { courseCode: { contains: search, mode: 'insensitive' as const } },
        { subjectBoard: { contains: search, mode: 'insensitive' as const } },
        { type: { contains: search, mode: 'insensitive' as const } },
        { semesterOffered: { contains: search, mode: 'insensitive' as const } },
        { department: { name: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
    ...(type && { type }),
    ...(departmentId && { departmentId }),
  };

  // Default to active only, unless 'all' is specified or a specific status is requested
  if (isActive !== undefined) {
    where.isActive = isActive;
  } else if (isActiveParam !== 'all') {
    where.isActive = true;
  }

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: { department: { select: { id: true, name: true, code: true } } },
      skip,
      take: limit,
      orderBy: { courseCode: 'asc' },
    }),
  ]);

  return { courses, meta: buildMeta(total, page, limit) };
}

export async function getById(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: { department: { select: { id: true, name: true, code: true } } },
  });
  if (!course) throw ApiError.notFound('Course not found');
  return course;
}

/** Map any user-friendly degreeLevel string to a valid Prisma DegreeLevel enum, or undefined if unrecognised. */
function normalizeDegreeLevel(val?: string): DegreeLevel | undefined {
  if (!val) return undefined;
  const upper = val.toUpperCase();
  if (upper === 'BACHELOR') return DegreeLevel.BACHELOR;
  if (upper === 'MASTER') return DegreeLevel.MASTER;
  if (upper === 'PHD' || upper === 'DOCTORATE') return DegreeLevel.PHD;
  // Common human-readable aliases sent from the frontend
  if (upper.includes('UNDERGRADUATE') || upper.includes('BACHELOR')) return DegreeLevel.BACHELOR;
  if (upper.includes('GRADUATE') || upper.includes('MASTER')) return DegreeLevel.MASTER;
  return undefined; // silently drop unrecognised values rather than crashing
}

function computeWeeklyHours(data: Partial<CourseInput>): number {
  return (data.weeklyLectureHours ?? 0) + (data.weeklyTutorialHours ?? 0) + (data.weeklyLabHours ?? 0);
}

export async function create(data: CourseInput) {
  const existing = await prisma.course.findUnique({ where: { courseCode: data.courseCode } });
  if (existing) throw ApiError.conflict('Course code already exists');
  const weeklyHours = data.weeklyHours ?? computeWeeklyHours(data);

  // departmentId is required FK — auto-assign first available dept if not provided
  let departmentId = data.departmentId;
  if (!departmentId) {
    const firstDept = await prisma.department.findFirst({ select: { id: true } });
    if (!firstDept) throw ApiError.badRequest('No departments exist. Please create a school first.');
    departmentId = firstDept.id;
  }

  const course = await prisma.course.create({
    data: { ...data, departmentId, weeklyHours, degreeLevel: normalizeDegreeLevel(data.degreeLevel as string | undefined) },
    include: { department: { select: { id: true, name: true, code: true } } },
  });

  // Notify admins + only the head(s) of the course's responsible department
  const recipients = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: 'ADMIN' },
        {
          role: 'DEPARTMENT_HEAD',
          ...(course.responsibleDepartment
            ? { facultyDepartment: course.responsibleDepartment }
            : { departmentId: course.departmentId }),
        },
      ],
    },
    select: { id: true },
  });
  await Promise.all(
    recipients.map((u) =>
      createNotification(
        u.id,
        NotificationType.SYSTEM_ALERT,
        'New Course Added',
        `Course ${course.courseCode} — ${course.title} has been added to the catalog.`,
        { courseId: course.id, courseCode: course.courseCode },
      ),
    ),
  );

  return course;
}

export async function update(id: string, data: Partial<CourseInput>) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw ApiError.notFound('Course not found');
  const weeklyHours =
    data.weeklyHours ??
    computeWeeklyHours({
      weeklyLectureHours: data.weeklyLectureHours !== undefined ? data.weeklyLectureHours : course.weeklyLectureHours,
      weeklyTutorialHours: data.weeklyTutorialHours !== undefined ? data.weeklyTutorialHours : course.weeklyTutorialHours,
      weeklyLabHours: data.weeklyLabHours !== undefined ? data.weeklyLabHours : course.weeklyLabHours,
    });
  const updated = await prisma.course.update({ where: { id }, data: { ...data, weeklyHours, degreeLevel: normalizeDegreeLevel(data.degreeLevel as string | undefined) } });

  const recipients = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { role: 'ADMIN' },
        {
          role: 'DEPARTMENT_HEAD',
          ...(updated.responsibleDepartment
            ? { facultyDepartment: updated.responsibleDepartment }
            : { departmentId: updated.departmentId }),
        },
      ],
    },
    select: { id: true },
  });
  await Promise.all(
    recipients.map((u) =>
      createNotification(
        u.id,
        NotificationType.SYSTEM_ALERT,
        'Course Updated',
        `Course ${updated.courseCode} — ${updated.title} has been updated.`,
        { courseId: updated.id, courseCode: updated.courseCode },
      ),
    ),
  );

  return updated;
}

export async function toggleActive(id: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw ApiError.notFound('Course not found');
  const updated = await prisma.course.update({
    where: { id },
    data: { isActive: !course.isActive },
    include: { department: { select: { id: true, name: true, code: true } } },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.SYSTEM_ALERT,
        updated.isActive ? 'Course Activated' : 'Course Deactivated',
        `Course ${updated.courseCode} — ${updated.title} has been ${updated.isActive ? 'activated' : 'deactivated'}.`,
        { courseId: updated.id, courseCode: updated.courseCode, isActive: updated.isActive },
      ),
    ),
  );

  return updated;
}

export async function remove(id: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw ApiError.notFound('Course not found');

  // Cascade: remove all dependent records before deleting the course
  await prisma.$transaction([
    prisma.workloadRecord.deleteMany({ where: { courseId: id } }),
    prisma.curriculumItem.deleteMany({ where: { courseId: id } }),
    prisma.planningRow.deleteMany({ where: { courseId: id } }),
    prisma.course.delete({ where: { id } }),
  ]);
}
