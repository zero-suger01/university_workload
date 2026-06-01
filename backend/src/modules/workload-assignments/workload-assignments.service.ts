// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { recalculate as recalculateStaffUnit } from '../staff-units/staff-units.service';
import { createNotification } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

// ─── Unified coverage recalculation ─────────────────────────────────────────
// Reads BOTH WorkloadAssignment (head planning) and WorkloadRecord (admin legacy)
// for the same PlanningRow, unions them to produce accurate covered/uncovered hours.
// Exported so planning.service.ts can call the same logic instead of a separate fn.
export async function recalculatePlanningRow(planningRowId: string) {
  const row = await prisma.planningRow.findUnique({
    where: { id: planningRowId },
    include: {
      course: true,
      semester: true,
      workloadAssignments: true,
      // Legacy admin-assigned records that reference this planning row
      workloadRecords: { where: { status: { not: 'CANCELLED' as any } } },
    },
  });
  if (!row) return;

  const wc = row.semester.weekCount;

  // ── Required hours (by type) ───────────────────────────────────────────────
  const totalLecRequired = (row.course.weeklyLectureHours || 0) * row.lectureGroups * wc;
  const totalTutRequired = (row.course.weeklyTutorialHours || 0) * row.tutorialGroups * wc;
  const totalLabRequired = (row.course.weeklyLabHours || 0) * row.labGroups * wc;
  const totalRequiredHours = totalLecRequired + totalTutRequired + totalLabRequired;

  // ── Covered hours from WorkloadAssignment (planning flow) ──────────────────
  const assignLec = row.workloadAssignments
    .filter((a) => a.assignType === 'LECTURE')
    .reduce((s, a) => s + a.totalHours, 0);
  const assignTut = row.workloadAssignments
    .filter((a) => a.assignType === 'TUTORIAL')
    .reduce((s, a) => s + a.totalHours, 0);
  const assignLab = row.workloadAssignments
    .filter((a) => a.assignType === 'LAB')
    .reduce((s, a) => s + a.totalHours, 0);

  // ── Covered hours from WorkloadRecord (legacy admin flow) ──────────────────
  // Legacy records store hours in lectureHours / seminarHours / labHours columns
  const legacyLec = row.workloadRecords.reduce((s, r) => s + (r.lectureHours || 0), 0);
  const legacyTut = row.workloadRecords.reduce((s, r) => s + (r.seminarHours || 0), 0);
  const legacyLab = row.workloadRecords.reduce((s, r) => s + (r.labHours || 0), 0);

  // ── Union: take max per type to avoid double-counting if both flows are used ─
  // If a department uses ONLY one system, the other will be 0 so max = the real value.
  // If both are used simultaneously, take the larger (more conservative for uncovered).
  const totalLecCovered = Math.max(assignLec, legacyLec);
  const totalTutCovered = Math.max(assignTut, legacyTut);
  const totalLabCovered = Math.max(assignLab, legacyLab);
  const totalCoveredHours = totalLecCovered + totalTutCovered + totalLabCovered;
  // Excel formula: Uncovered Hours = V - X = Covered - Required (negative = shortage)
  const uncoveredHours = totalCoveredHours - totalRequiredHours;

  return prisma.planningRow.update({
    where: { id: planningRowId },
    data: {
      totalRequiredHours,
      totalLecRequired,
      totalTutRequired,
      totalLabRequired,
      totalCoveredHours,
      totalLecCovered,
      totalTutCovered,
      totalLabCovered,
      uncoveredHours,
    },
  });
}

export async function getByPlanningRow(planningRowId: string) {
  return prisma.workloadAssignment.findMany({
    where: { planningRowId },
    include: {
      faculty: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          academicPosition: true,
          employmentType: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getByFaculty(facultyId: string, semesterId?: string) {
  return prisma.workloadAssignment.findMany({
    where: {
      facultyId,
      ...(semesterId && { planningRow: { semesterId } }),
    },
    include: {
      planningRow: {
        include: {
          course: { select: { id: true, courseCode: true, title: true } },
          program: { select: { id: true, name: true, code: true } },
          semester: { select: { id: true, name: true, academicYear: true, term: true, weekCount: true } },
        },
      },
    },
  });
}

export async function create(data: any) {
  const planningRow = await prisma.planningRow.findUnique({
    where: { id: data.planningRowId },
    include: {
      course: true,
      semester: true,
    },
  });
  if (!planningRow) throw ApiError.notFound('Planning row not found');

  const { course, semester } = planningRow;
  const groupsCount = data.groupsCount ?? 1;

  let hoursPerWeek = 0;
  if (data.assignType === 'LECTURE') {
    hoursPerWeek = (course.weeklyLectureHours || 0) * groupsCount;
  } else if (data.assignType === 'TUTORIAL') {
    hoursPerWeek = (course.weeklyTutorialHours || 0) * groupsCount;
  } else if (data.assignType === 'LAB') {
    hoursPerWeek = (course.weeklyLabHours || 0) * groupsCount;
  }

  const totalHours = hoursPerWeek * semester.weekCount;

  const assignment = await prisma.workloadAssignment.create({
    data: {
      planningRowId: data.planningRowId,
      facultyId: data.facultyId,
      assignType: data.assignType,
      groupsCount,
      hoursPerWeek,
      totalHours,
      notes: data.notes,
    },
    include: {
      faculty: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          academicPosition: true,
          employmentType: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  await recalculatePlanningRow(data.planningRowId);

  // ── Auto-trigger: keep StaffUnit in sync ─────────────────────────────────
  const semesterId = planningRow.semesterId;
  recalculateStaffUnit(semesterId).catch(() => {}); // fire-and-forget, non-blocking

  // ── Notifications ─────────────────────────────────────────────────────────
  const typeLabel = data.assignType === 'LECTURE' ? 'Lecture' : data.assignType === 'TUTORIAL' ? 'Tutorial' : 'Lab';
  const courseCode = course.courseCode;
  const semesterName = semester.name;

  // 1. Notify the faculty member who was assigned
  await createNotification(
    data.facultyId,
    NotificationType.WORKLOAD_ASSIGNED,
    'Workload Assigned',
    `You have been assigned to teach ${typeLabel} for ${courseCode} (${semesterName}).`,
    { courseCode, semesterName, assignType: data.assignType, totalHours },
  );

  // 2. Notify all admins that a head assigned faculty
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  const assignedFacultyName = `${assignment.faculty?.firstName || ''} ${assignment.faculty?.lastName || ''}`.trim();
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.WORKLOAD_ASSIGNED,
        'Workload Assigned by Department Head',
        `${assignedFacultyName || 'A faculty member'} was assigned to ${typeLabel} for ${courseCode} (${semesterName}).`,
        { courseCode, semesterName, assignType: data.assignType, totalHours, facultyId: data.facultyId },
      ),
    ),
  );

  return assignment;
}

export async function update(id: string, data: any) {
  const existing = await prisma.workloadAssignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Assignment not found');

  // Recalculate hours if assignType or groupsCount changed
  let updateData: any = { ...data };

  if (data.assignType || data.groupsCount !== undefined || data.planningRowId) {
    const planningRowId = data.planningRowId ?? existing.planningRowId;
    const assignType = data.assignType ?? existing.assignType;
    const groupsCount = data.groupsCount ?? existing.groupsCount;

    const planningRow = await prisma.planningRow.findUnique({
      where: { id: planningRowId },
      include: { course: true, semester: true },
    });
    if (!planningRow) throw ApiError.notFound('Planning row not found');

    const { course, semester } = planningRow;
    let hoursPerWeek = 0;
    if (assignType === 'LECTURE') {
      hoursPerWeek = (course.weeklyLectureHours || 0) * groupsCount;
    } else if (assignType === 'TUTORIAL') {
      hoursPerWeek = (course.weeklyTutorialHours || 0) * groupsCount;
    } else if (assignType === 'LAB') {
      hoursPerWeek = (course.weeklyLabHours || 0) * groupsCount;
    }

    updateData.hoursPerWeek = hoursPerWeek;
    updateData.totalHours = hoursPerWeek * semester.weekCount;
  }

  const updated = await prisma.workloadAssignment.update({
    where: { id },
    data: updateData,
    include: {
      faculty: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          academicPosition: true,
          employmentType: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  await recalculatePlanningRow(updated.planningRowId);

  // ── Auto-trigger StaffUnit recalculation ────────────────────────────────────
  const updatedRow = await prisma.planningRow.findUnique({
    where: { id: updated.planningRowId },
    select: { semesterId: true },
  });
  if (updatedRow) recalculateStaffUnit(updatedRow.semesterId).catch(() => {});

  return updated;
}

export async function remove(id: string) {
  const existing = await prisma.workloadAssignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Assignment not found');

  const { planningRowId } = existing;
  await prisma.workloadAssignment.delete({ where: { id } });
  await recalculatePlanningRow(planningRowId);

  // ── Auto-trigger StaffUnit recalculation ────────────────────────────────────
  const deletedRow = await prisma.planningRow.findUnique({
    where: { id: planningRowId },
    select: { semesterId: true },
  });
  if (deletedRow) recalculateStaffUnit(deletedRow.semesterId).catch(() => {});
}
