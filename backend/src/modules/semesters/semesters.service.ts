import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { createNotification } from '../notifications/notifications.service';
import type { SemesterInput } from './semesters.schema';

// Auto-end the current semester once its endDate has passed.
// Called on server startup, hourly, and before dashboard reads so the
// transition happens without an admin having to click "deactivate".
export async function expireEndedSemesters() {
  const now = new Date();
  const ended = await prisma.semester.findFirst({
    where: { isCurrent: true, endDate: { lt: now } },
  });
  if (!ended) return null;

  await prisma.semester.update({
    where: { id: ended.id },
    data: { isActive: false, isCurrent: false },
  });

  const recipients = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    recipients.map((u) =>
      createNotification(
        u.id,
        NotificationType.SYSTEM_ALERT,
        'Semester Ended',
        `Semester ${ended.name} (${ended.academicYear}) ended on ${ended.endDate.toISOString().slice(0, 10)}. Please activate the next semester.`,
        { semesterId: ended.id, semesterName: ended.name },
      ),
    ),
  );

  console.log(`📅 Semester "${ended.name}" auto-ended (endDate passed)`);
  return ended;
}

// Most recently finished semester — used by dashboards to explain an
// empty state when nothing is currently active.
export async function getLastEndedSemester() {
  return prisma.semester.findFirst({
    where: { endDate: { lt: new Date() } },
    orderBy: { endDate: 'desc' },
  });
}

export async function getAll() {
  return prisma.semester.findMany({ orderBy: [{ academicYear: 'desc' }, { term: 'asc' }] });
}

export async function getById(id: string) {
  const s = await prisma.semester.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Semester not found');
  return s;
}

export async function create(data: SemesterInput) {
  const existing = await prisma.semester.findUnique({
    where: { academicYear_term: { academicYear: data.academicYear, term: data.term } },
  });
  if (existing) throw ApiError.conflict('Semester already exists for this academic year and term');

  const semester = await prisma.semester.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    },
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
        'New Semester Created',
        `Semester ${semester.name} has been created.`,
        { semesterId: semester.id, semesterName: semester.name },
      ),
    ),
  );

  return semester;
}

export async function update(id: string, data: Partial<SemesterInput>) {
  const s = await prisma.semester.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Semester not found');
  const updated = await prisma.semester.update({ where: { id }, data });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.SYSTEM_ALERT,
        'Semester Updated',
        `Semester ${updated.name} has been updated.`,
        { semesterId: updated.id, semesterName: updated.name },
      ),
    ),
  );

  return updated;
}

export async function activate(id: string) {
  const s = await prisma.semester.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Semester not found');

  // Deactivate all, then activate this one
  await prisma.$transaction([
    prisma.semester.updateMany({ data: { isActive: false, isCurrent: false } }),
    prisma.semester.update({ where: { id }, data: { isActive: true, isCurrent: true } }),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.SYSTEM_ALERT,
        'Semester Activated',
        `Semester ${s.name} has been activated.`,
        { semesterId: id, semesterName: s.name },
      ),
    ),
  );

  return prisma.semester.findUnique({ where: { id } });
}

export async function deactivate(id: string) {
  const s = await prisma.semester.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Semester not found');
  const updated = await prisma.semester.update({ where: { id }, data: { isActive: false, isCurrent: false } });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.SYSTEM_ALERT,
        'Semester Deactivated',
        `Semester ${s.name} has been deactivated.`,
        { semesterId: id, semesterName: s.name },
      ),
    ),
  );

  return updated;
}

export async function remove(id: string) {
  const s = await prisma.semester.findUnique({ where: { id } });
  if (!s) throw ApiError.notFound('Semester not found');

  // Check for related records that would block deletion
  const [workloadCount, planningCount, cohortCount, vacancyCount, staffUnitCount, cqiCount] = await Promise.all([
    prisma.workloadRecord.count({ where: { semesterId: id } }),
    prisma.planningRow.count({ where: { semesterId: id } }),
    prisma.studentCohort.count({ where: { semesterId: id } }),
    prisma.vacancyRecord.count({ where: { semesterId: id } }),
    prisma.staffUnit.count({ where: { semesterId: id } }),
    prisma.cQIReport.count({ where: { semesterId: id } }),
  ]);

  const blocking: string[] = [];
  if (workloadCount > 0) blocking.push(`${workloadCount} workload record(s)`);
  if (planningCount > 0) blocking.push(`${planningCount} planning row(s)`);
  if (cohortCount > 0) blocking.push(`${cohortCount} student cohort(s)`);
  if (vacancyCount > 0) blocking.push(`${vacancyCount} vacancy record(s)`);
  if (staffUnitCount > 0) blocking.push(`${staffUnitCount} staff unit(s)`);
  if (cqiCount > 0) blocking.push(`${cqiCount} CQI report(s)`);

  if (blocking.length > 0) {
    throw ApiError.conflict(
      `Cannot delete semester "${s.name}": it is referenced by ${blocking.join(', ')}. ` +
      `Please remove or reassign these records first, or deactivate the semester instead.`,
    );
  }

  // Safe to delete — also clear optional Report references first
  await prisma.report.updateMany({ where: { semesterId: id }, data: { semesterId: null } });
  await prisma.semester.delete({ where: { id } });

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.SYSTEM_ALERT,
        'Semester Removed',
        `Semester ${s.name} has been removed.`,
        { semesterId: id, semesterName: s.name },
      ),
    ),
  );

  return s;
}
