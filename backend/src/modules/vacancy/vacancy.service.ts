// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

// Fallback if department has no avgWeeklyLoad set (should not happen after migration)
const FALLBACK_AVG_WEEKLY_LOAD = 30; // hours/week

export async function getForecast(semesterId: string, departmentId?: string) {
  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) throw ApiError.notFound('Semester not found');

  const weekCount = semester.weekCount;

  // ── Load all departments with their load norm ────────────────────────────────
  const allDepts = await prisma.department.findMany({
    select: { id: true, name: true, code: true, avgWeeklyLoad: true },
    ...(departmentId && { where: { id: departmentId } }),
  });
  const deptNormMap = new Map(allDepts.map(d => [d.id, d]));

  // ── Planning rows with per-type breakdown fields ─────────────────────────────
  const planningRows = await prisma.planningRow.findMany({
    where: {
      semesterId,
      ...(departmentId && { course: { departmentId } }),
    },
    include: {
      course: {
        select: {
          departmentId: true,
          weeklyLectureHours: true,
          weeklyTutorialHours: true,
          weeklyLabHours: true,
          department: { select: { id: true, name: true, code: true, avgWeeklyLoad: true } },
        },
      },
      // Both sources for covered hours (same union logic as recalculatePlanningRow)
      workloadAssignments: { select: { totalHours: true } },
      workloadRecords: {
        where: { status: { not: 'CANCELLED' as any } },
        select: { totalHours: true },
      },
    },
  });

  // ── Aggregate by department ──────────────────────────────────────────────────
  const deptMap = new Map<string, {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    avgWeeklyLoad: number;
    totalRequired: number;
    totalCovered: number;
  }>();

  for (const row of planningRows) {
    const dept = row.course.department;
    if (!deptMap.has(dept.id)) {
      deptMap.set(dept.id, {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        avgWeeklyLoad: dept.avgWeeklyLoad ?? FALLBACK_AVG_WEEKLY_LOAD,
        totalRequired: 0,
        totalCovered: 0,
      });
    }
    const entry = deptMap.get(dept.id)!;

    // ── Required: breakdown formula (Bug #1 fix) ─────────────────────────────
    // Each group type has its own hourly rate — do NOT multiply total weeklyHours by all groups
    const lecRequired = (row.course.weeklyLectureHours || 0) * row.lectureGroups * weekCount;
    const tutRequired = (row.course.weeklyTutorialHours || 0) * row.tutorialGroups * weekCount;
    const labRequired = (row.course.weeklyLabHours || 0) * row.labGroups * weekCount;
    entry.totalRequired += lecRequired + tutRequired + labRequired;

    // ── Covered: union of WorkloadAssignment and WorkloadRecord (Bug #2 fix) ──
    const assignCovered = row.workloadAssignments.reduce((s, a) => s + a.totalHours, 0);
    const legacyCovered = row.workloadRecords.reduce((s, r) => s + r.totalHours, 0);
    // Take max to avoid double-counting when both systems are used for same row
    entry.totalCovered += Math.max(assignCovered, legacyCovered);
  }

  // ── Build results with dynamic avgLoad per department ────────────────────────
  const results = Array.from(deptMap.values()).map(d => {
    const uncoveredHours = Math.max(0, d.totalRequired - d.totalCovered);
    // avgLoad = hours per semester for one full-time staff member
    const semesterLoad = d.avgWeeklyLoad * weekCount;
    const staffNeeded = uncoveredHours > 0 ? Math.ceil(uncoveredHours / semesterLoad) : 0;
    const coveragePercent = d.totalRequired > 0
      ? Math.round((d.totalCovered / d.totalRequired) * 100)
      : 100;
    return {
      ...d,
      uncoveredHours,
      staffNeeded,
      coveragePercent,
      avgLoadUsed: semesterLoad,
    };
  });

  // ── Persist to VacancyRecord ─────────────────────────────────────────────────
  await prisma.$transaction(
    results.map(r =>
      prisma.vacancyRecord.upsert({
        where: { departmentId_semesterId: { departmentId: r.departmentId, semesterId } },
        create: {
          departmentId: r.departmentId,
          semesterId,
          totalRequired: r.totalRequired,
          totalCovered: r.totalCovered,
          uncoveredHours: r.uncoveredHours,
          staffNeeded: r.staffNeeded,
          avgLoadUsed: r.avgLoadUsed,
        },
        update: {
          totalRequired: r.totalRequired,
          totalCovered: r.totalCovered,
          uncoveredHours: r.uncoveredHours,
          staffNeeded: r.staffNeeded,
          avgLoadUsed: r.avgLoadUsed,
        },
      }),
    ),
  );

  const totalRequired = results.reduce((s, r) => s + r.totalRequired, 0);
  const totalCovered = results.reduce((s, r) => s + r.totalCovered, 0);
  const totalUncovered = results.reduce((s, r) => s + r.uncoveredHours, 0);
  const totalStaffNeeded = results.reduce((s, r) => s + r.staffNeeded, 0);

  return {
    semester: { id: semester.id, name: semester.name, academicYear: semester.academicYear },
    summary: { totalRequired, totalCovered, totalUncovered, totalStaffNeeded },
    byDepartment: results,
  };
}

export async function getHistory(semesterId?: string) {
  return prisma.vacancyRecord.findMany({
    where: { ...(semesterId && { semesterId }) },
    include: {
      department: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true, academicYear: true, term: true } },
    },
    orderBy: [{ semester: { academicYear: 'desc' } }, { department: { name: 'asc' } }],
  });
}
