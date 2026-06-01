import { Role, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { calculateTotalHours, computeLoadFlags, calculateProfessorWorkload } from '../../utils/workloadCalc';
import { createNotification } from '../notifications/notifications.service';
import { recalculatePlanningRow } from '../workload-assignments/workload-assignments.service';
import type { AuthUser } from '../../middleware/authenticate';
import type { CreateWorkloadInput, UpdateWorkloadInput } from './workloads.schema';

function buildChangeDescription(data: UpdateWorkloadInput, old: any): { changes: string[]; details: Record<string, { old: any; new: any }> } {
  const changes: string[] = [];
  const details: Record<string, { old: any; new: any }> = {};

  const fieldLabels: Record<string, string> = {
    facultyId: 'Faculty',
    courseId: 'Course',
    semesterId: 'Semester',
    lectureHours: 'Lecture Hours',
    seminarHours: 'Seminar Hours',
    labHours: 'Lab Hours',
    advisingHours: 'Advising Hours',
    researchHours: 'Research Hours',
    adminHours: 'Admin Hours',
    otherHours: 'Other Hours',
    groupCodes: 'Groups-Joint Groups',
    notes: 'Notes',
    status: 'Status',
    // Removed: studentCount
    teachingLanguage: 'Teaching Language',
    weekCount: 'Week Count',
    yearOfStudy: 'Year of Study',
    semesterNumbers: 'Semester Numbers',
    program: 'Program',
    courseType: 'Course Type',
    courseECTS: 'Course ECTS',
    semesterECTS: 'Semester ECTS',
    responsibleDepartment: 'Responsible Department',
    // Removed: confirmedByResDept, groupNumbers, totalNumberOfGroups
    lectureGroup: 'Lecture Group',
    tutorialGroup: 'Tutorial Group',
    totalCoveredTutorialHours: 'Covered Tutorial Hours',
    totalCoveredLectureHours: 'Covered Lecture Hours',
    uncoveredHours: 'Uncovered Hours',
    lecturesAndTutorialsNo: 'Lectures & Tutorials No',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (key in data && (data as any)[key] !== undefined) {
      const oldVal = old[key];
      const newVal = (data as any)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push(`${label}: ${formatVal(oldVal)} → ${formatVal(newVal)}`);
        details[key] = { old: oldVal, new: newVal };
      }
    }
  }

  return { changes, details };
}

function formatVal(v: any): string {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  return String(v);
}

const INCLUDE = {
  faculty: { select: { id: true, firstName: true, lastName: true, email: true, departmentId: true } },
  course: { select: { id: true, courseCode: true, title: true, type: true } },
  semester: { select: { id: true, name: true, academicYear: true, term: true } },
  assignedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
  WorkloadEditHistory: { include: { editedBy: { select: { id: true, firstName: true, lastName: true, role: true } } }, orderBy: { editedAt: 'desc' as const }, take: 3 },
};

export async function getAll(user: AuthUser, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const semesterId = query.semesterId as string | undefined;

  let where: Record<string, unknown> = { ...(semesterId && { semesterId }) };

  if (user.role === Role.FACULTY) {
    where.facultyId = user.userId;
  } else if (user.role === Role.DEPARTMENT_HEAD) {
    if (!user.departmentId) {
      return { workloads: [], meta: buildMeta(0, page, limit) };
    }
    where.faculty = { departmentId: user.departmentId };
  }

  const [total, records] = await Promise.all([
    prisma.workloadRecord.count({ where }),
    prisma.workloadRecord.findMany({
      where,
      include: INCLUDE,
      skip,
      take: limit,
      orderBy: { assignedAt: 'desc' },
    }),
  ]);

  return { workloads: records, meta: buildMeta(total, page, limit) };
}

export async function getSummary(user: AuthUser, query: Record<string, unknown>) {
  const semesterId = query.semesterId as string | undefined;
  if (!semesterId) throw ApiError.badRequest('semesterId is required');

  const deptFilter = user.role === Role.DEPARTMENT_HEAD ? { departmentId: user.departmentId! } : {};

  const facultyList = await prisma.user.findMany({
    where: { role: Role.FACULTY, isActive: true, ...deptFilter },
    select: {
      id: true, firstName: true, lastName: true, employeeId: true,
      maxWeeklyHours: true, minWeeklyHours: true,
      department: { select: { name: true, code: true } },
      workloadRecords: {
        where: { semesterId, status: { not: 'CANCELLED' } },
        select: { totalHours: true },
      },
    },
  });

  return facultyList.map((faculty) => {
    const { workloadRecords, ...facultyData } = faculty;
    const totalHours = workloadRecords.reduce((s, r) => s + r.totalHours, 0);
    const isOverloaded = totalHours > 0 && totalHours > faculty.maxWeeklyHours;
    const isUnderloaded = totalHours < faculty.minWeeklyHours;
    return {
      faculty: facultyData,
      totalHours,
      courseCount: workloadRecords.length,
      isOverloaded,
      isUnderloaded,
    };
  });
}

export async function getById(id: string, user: AuthUser) {
  const record = await prisma.workloadRecord.findUnique({ where: { id }, include: INCLUDE });
  if (!record) throw ApiError.notFound('Workload record not found');

  if (user.role === Role.FACULTY && record.facultyId !== user.userId) {
    throw ApiError.forbidden();
  }

  return record;
}

/** Returns all unique group codes across all StudentCohorts (flat deduplicated list). */
export async function getAvailableGroupCodes() {
  const cohorts = await prisma.studentCohort.findMany({
    select: { groupCodes: true },
  });
  const all = cohorts.flatMap((c) => c.groupCodes);
  return [...new Set(all)].sort();
}

/** Returns group codes from workload records for a semester, mapped to their assigned faculty. */
export async function getGroupCodeConflicts(
  semesterId: string,
  groupCodes: string[],
  excludeWorkloadId?: string,
) {
  if (!groupCodes.length) return [];

  const records = await prisma.workloadRecord.findMany({
    where: {
      semesterId,
      status: { not: 'CANCELLED' },
      ...(excludeWorkloadId && { id: { not: excludeWorkloadId } }),
    },
    select: {
      id: true,
      groupCodes: true,
      faculty: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const conflicts: { groupCode: string; faculty: { id: string; firstName: string; lastName: string } }[] = [];
  for (const record of records) {
    for (const code of record.groupCodes) {
      if (groupCodes.includes(code)) {
        conflicts.push({ groupCode: code, faculty: record.faculty });
      }
    }
  }
  return conflicts;
}

/** Returns all workload assignments for a given course+semester, with required/covered/uncovered totals. */
export async function getCourseAssignments(courseId: string, semesterId: string) {
  const [course, semester, records, planningRow] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    prisma.semester.findUnique({ where: { id: semesterId } }),
    prisma.workloadRecord.findMany({
      where: { courseId, semesterId, status: { not: 'CANCELLED' } },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.planningRow.findFirst({ where: { courseId, semesterId } }),
  ]);

  if (!course || !semester) throw ApiError.notFound('Course or semester not found');

  const lectureGroups = planningRow?.lectureGroups ?? 1;
  const tutorialGroups = planningRow?.tutorialGroups ?? 1;
  // Excel Fall2026_planning uses Small Groups (O) for BOTH Tutorial and Lab
  const labGroupsEffective = planningRow?.labGroups || tutorialGroups;

  // Lecture is taught to all groups together (not multiplied by cohorts)
  const requiredLecture = (course.weeklyLectureHours || 0);
  const requiredTutorial = (course.weeklyTutorialHours || 0) * tutorialGroups;
  const requiredLab = (course.weeklyLabHours || 0) * labGroupsEffective;
  const requiredTotal = requiredLecture + requiredTutorial + requiredLab;

  const coveredLecture = records.reduce((s, r) => s + (r.lectureHours || 0), 0);
  const coveredTutorial = records.reduce((s, r) => s + (r.seminarHours || 0), 0);
  const coveredLab = records.reduce((s, r) => s + (r.labHours || 0), 0);
  const coveredTotal = coveredLecture + coveredTutorial + coveredLab;

  // Excel formula: Uncovered Hours = V - X = Covered - Required (negative = shortage)
  return {
    course: { id: course.id, courseCode: course.courseCode, title: course.title, ectsCredits: course.ectsCredits, departmentId: course.departmentId },
    semester: { id: semester.id, name: semester.name, weekCount: semester.weekCount },
    required: { lecture: requiredLecture, tutorial: requiredTutorial, lab: requiredLab, total: requiredTotal },
    covered: { lecture: coveredLecture, tutorial: coveredTutorial, lab: coveredLab, total: coveredTotal },
    uncovered: { lecture: coveredLecture - requiredLecture, tutorial: coveredTutorial - requiredTutorial, lab: coveredLab - requiredLab, total: coveredTotal - requiredTotal },
    assignments: records,
    planningRow,
  };
}

export async function create(rawData: CreateWorkloadInput, assignedById: string) {
  const resolvedFacultyId = (rawData.facultyId && rawData.facultyId.trim()) ? rawData.facultyId : assignedById;
  const faculty = await prisma.user.findUnique({ where: { id: resolvedFacultyId } });
  if (!faculty) throw ApiError.notFound('Faculty not found');

  // Resolve semesterId — fall back to the first available semester when empty
  let resolvedSemesterId = rawData.semesterId || '';
  if (!resolvedSemesterId) {
    const firstSemester = await prisma.semester.findFirst({ orderBy: { startDate: 'asc' } });
    if (!firstSemester) throw ApiError.badRequest('No semesters configured in the system');
    resolvedSemesterId = firstSemester.id;
  }

  const data: CreateWorkloadInput & { facultyId: string; semesterId: string } = {
    ...rawData,
    facultyId: resolvedFacultyId,
    semesterId: resolvedSemesterId,
  };

  // Prevent duplicate: same faculty + course + semester
  const duplicate = await prisma.workloadRecord.findFirst({
    where: {
      facultyId: data.facultyId,
      courseId: data.courseId,
      semesterId: data.semesterId,
      status: { not: 'CANCELLED' },
    },
  });
  if (duplicate) {
    throw ApiError.conflict(
      'This course is already assigned to this faculty for the selected semester.',
    );
  }

  // ── Auto-populate from course catalog if missing ────────────────────────────
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    include: { department: { select: { name: true } } },
  });
  if (!course) throw ApiError.notFound('Course not found');

  const enrichedData = { ...data };
  if (enrichedData.courseECTS === undefined || enrichedData.courseECTS === null) {
    enrichedData.courseECTS = course.ectsCredits ?? 0;
  }
  if (!enrichedData.responsibleDepartment) {
    enrichedData.responsibleDepartment = course.department?.name ?? '';
  }

  // ── Auto-link to PlanningRow (find or create) ───────────────────────────────
  let planningRowId = enrichedData.planningRowId;
  if (!planningRowId) {
    // Try to find existing planning row
    const existingRow = await prisma.planningRow.findFirst({
      where: {
        courseId: data.courseId,
        semesterId: data.semesterId,
      },
    });
    if (existingRow) {
      planningRowId = existingRow.id;
    } else {
      // Try to find program by name
      const programName = enrichedData.program ?? '';
      let program = await prisma.program.findFirst({
        where: { name: { contains: programName.split(',')[0]?.trim(), mode: 'insensitive' } },
      });
      // Fallback: use first available program to satisfy FK constraint
      if (!program) {
        program = await prisma.program.findFirst({ where: { isActive: true } });
      }
      // Create a new planning row
      const newRow = await prisma.planningRow.create({
        data: {
          courseId: data.courseId,
          semesterId: data.semesterId,
          programId: program?.id ?? '',
          yearOfStudy: enrichedData.yearOfStudy?.[0] ?? 1,
          semesterNumber: enrichedData.semesterNumbers?.[0] ?? 1,
          teachingLanguage: (enrichedData.teachingLanguage as any) ?? 'UZB',
          lectureGroups: enrichedData.lectureGroup ?? 1,
          tutorialGroups: enrichedData.tutorialGroup ?? 1,
          labGroups: 0,
          status: 'DRAFT',
        },
      });
      planningRowId = newRow.id;
    }
  }

  const groupCountCreate = (enrichedData.groupCodes?.length && enrichedData.groupCodes.length > 0)
    ? enrichedData.groupCodes.length
    : (enrichedData.tutorialGroup || 1);
  const thisHours = calculateProfessorWorkload({ ...enrichedData, groupCount: groupCountCreate });

  const existingRecords = await prisma.workloadRecord.findMany({
    where: {
      facultyId: data.facultyId,
      semesterId: data.semesterId,
      status: { not: 'CANCELLED' },
    },
    select: { id: true, totalHours: true },
  });
  const newFacultyTotal = existingRecords.reduce((s, r) => s + r.totalHours, 0) + thisHours;
  const { isOverloaded, isUnderloaded } = computeLoadFlags(
    newFacultyTotal,
    faculty.maxWeeklyHours,
    faculty.minWeeklyHours,
  );

  if (existingRecords.length > 0) {
    await prisma.workloadRecord.updateMany({
      where: { id: { in: existingRecords.map((r) => r.id) } },
      data: { isOverloaded, isUnderloaded },
    });
  }

  const { groupCodes = [], ...rest } = enrichedData;

  const assigner = await prisma.user.findUnique({
    where: { id: assignedById },
    select: { firstName: true, lastName: true, role: true },
  });

  const record = await prisma.workloadRecord.create({
    data: {
      ...rest,
      groupCodes,
      totalHours: thisHours,
      isOverloaded,
      isUnderloaded,
      assignedById,
      status: 'ACTIVE',
      approvalStatus: 'PENDING',
      planningRowId,
      // Explicitly set assigned hours so they are never dropped by Prisma's type checker
      assignedLectureHours: enrichedData.assignedLectureHours ?? 0,
      assignedTutorialHours: enrichedData.assignedTutorialHours ?? 0,
      assignedLabHours: enrichedData.assignedLabHours ?? 0,
    },
    include: INCLUDE,
  });

  // ── Recalculate PlanningRow covered/uncovered hours ─────────────────────────
  if (planningRowId) {
    await recalculatePlanningRow(planningRowId);
  }

  if (assigner) {
    await prisma.workloadEditHistory.create({
      data: {
        workloadRecordId: record.id,
        editedById: assignedById,
        editedByRole: assigner.role,
      },
    });
  }

  // Notify the faculty
  await createNotification(
    data.facultyId,
    NotificationType.WORKLOAD_ASSIGNED,
    'New Workload Assigned',
    `You have been assigned to ${record.course?.courseCode || 'a course'} for ${record.semester?.name || 'the current semester'}.`,
    { workloadId: record.id, courseCode: record.course?.courseCode, semesterName: record.semester?.name },
  );

  // Cross-notify: HEAD creates → notify ADMINs; ADMIN creates → notify dept HEAD
  if (assigner?.role === Role.DEPARTMENT_HEAD) {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          NotificationType.WORKLOAD_ASSIGNED,
          'Workload Assigned by Department Head',
          `${assigner.firstName} ${assigner.lastName} assigned ${record.course?.courseCode || 'a course'} to faculty for ${record.semester?.name || 'the current semester'}.`,
          { workloadId: record.id, courseCode: record.course?.courseCode, semesterName: record.semester?.name, assignedById },
        ),
      ),
    );
  } else if (assigner?.role === Role.ADMIN) {
    // Match heads by facultyDepartment (free-text responsible dept) first, fallback to departmentId
    const profDept = (faculty as any).facultyDepartment as string | undefined;
    const heads = await prisma.user.findMany({
      where: {
        role: Role.DEPARTMENT_HEAD,
        isActive: true,
        ...(profDept ? { facultyDepartment: profDept } : faculty.departmentId ? { departmentId: faculty.departmentId } : {}),
      },
      select: { id: true },
    });
    const profName = `${faculty.firstName} ${faculty.lastName}`;
    await Promise.all(
      heads.map((head) =>
        createNotification(
          head.id,
          NotificationType.WORKLOAD_ASSIGNED,
          'Workload Assigned by Admin',
          `Admin assigned ${record.course?.courseCode || 'a course'} to ${profName} in your department for ${record.semester?.name || 'the current semester'}.`,
          { workloadId: record.id, courseCode: record.course?.courseCode, semesterName: record.semester?.name, assignedById },
        ),
      ),
    );
  }

  // Always resync covered/uncovered hours for all records of this course+semester after a new assignment
  await resyncCoveredHours(record.courseId!, record.semesterId!);

  // Re-fetch to include the newly created history
  return prisma.workloadRecord.findUnique({ where: { id: record.id }, include: INCLUDE });
}

async function resyncCoveredHours(courseId: string, semesterId: string) {
  const records = await prisma.workloadRecord.findMany({
    where: { courseId, semesterId, status: { not: 'CANCELLED' } },
    select: {
      id: true,
      lectureHours: true,
      seminarHours: true,
      labHours: true,
      assignedLectureHours: true,
      assignedTutorialHours: true,
      assignedLabHours: true,
    },
  });
  if (!records.length) return;

  const sumLec = records.reduce((s, r) => s + (r.assignedLectureHours ?? 0), 0);
  const sumTut = records.reduce((s, r) => s + (r.assignedTutorialHours ?? 0), 0);
  const sumLab = records.reduce((s, r) => s + (r.assignedLabHours ?? 0), 0);
  const covTotal = sumLec + sumTut + sumLab;

  console.log(`[resync] courseId=${courseId} records=${records.length} sumLec=${sumLec} sumTut=${sumTut} sumLab=${sumLab} covTotal=${covTotal}`);

  await Promise.all(
    records.map((r) => {
      const required = (r.lectureHours || 0) + (r.seminarHours || 0) + (r.labHours || 0);
      return prisma.workloadRecord.update({
        where: { id: r.id },
        data: {
          totalCoveredLectureHours: sumLec,
          totalCoveredTutorialHours: sumTut,
          totalCoveredLabHours: sumLab,
          uncoveredHours: covTotal - required,
        },
      });
    }),
  );
}

export async function update(id: string, data: UpdateWorkloadInput, user: AuthUser) {
  const record = await prisma.workloadRecord.findUnique({
    where: { id },
    include: { faculty: true },
  });
  if (!record) throw ApiError.notFound('Workload record not found');

  if (user.role === Role.DEPARTMENT_HEAD && record.faculty.departmentId !== user.departmentId) {
    throw ApiError.forbidden();
  }

  // If facultyId/courseId/semesterId are changing, validate no duplicate
  const newFacultyId = data.facultyId ?? record.facultyId;
  const newCourseId = data.courseId ?? record.courseId;
  const newSemesterId = data.semesterId ?? record.semesterId;

  const isKeyChange =
    newFacultyId !== record.facultyId ||
    newCourseId !== record.courseId ||
    newSemesterId !== record.semesterId;

  if (isKeyChange) {
    const conflict = await prisma.workloadRecord.findFirst({
      where: {
        facultyId: newFacultyId,
        courseId: newCourseId,
        semesterId: newSemesterId,
        status: { not: 'CANCELLED' },
        id: { not: id },
      },
    });
    if (conflict) {
      throw ApiError.conflict(
        'This course is already assigned to this faculty for the selected semester.',
      );
    }
  }

  // Fetch the faculty for load limits (may be a different faculty after reassignment)
  const targetFaculty = isKeyChange && data.facultyId
    ? await prisma.user.findUnique({ where: { id: newFacultyId } })
    : record.faculty;
  if (!targetFaculty) throw ApiError.notFound('Faculty not found');

  const merged = {
    lectureHours: data.lectureHours !== undefined ? data.lectureHours : record.lectureHours,
    seminarHours: data.seminarHours !== undefined ? data.seminarHours : record.seminarHours,
    labHours: data.labHours !== undefined ? data.labHours : record.labHours,
    advisingHours: data.advisingHours !== undefined ? data.advisingHours : record.advisingHours,
    researchHours: data.researchHours !== undefined ? data.researchHours : record.researchHours,
    adminHours: data.adminHours !== undefined ? data.adminHours : record.adminHours,
    otherHours: data.otherHours !== undefined ? data.otherHours : record.otherHours,
  };
  const groupCountUpdate = (data.groupCodes?.length && data.groupCodes.length > 0)
    ? data.groupCodes.length
    : (record.groupCodes?.length && record.groupCodes.length > 0)
      ? record.groupCodes.length
      : (data.tutorialGroup !== undefined ? data.tutorialGroup : record.tutorialGroup) || 1;
  const thisHours = calculateProfessorWorkload({ ...merged, groupCount: groupCountUpdate });

  // Build a description of what changed for notifications
  const { changes, details } = buildChangeDescription(data, record);
  const changeSummary = changes.length > 0
    ? changes.join('; ')
    : 'Some fields were updated.';

  // Recalculate faculty total using the target faculty + semester
  const siblings = await prisma.workloadRecord.findMany({
    where: {
      facultyId: newFacultyId,
      semesterId: newSemesterId,
      status: { not: 'CANCELLED' },
      id: { not: id },
    },
    select: { id: true, totalHours: true },
  });
  const newTotal = siblings.reduce((s, r) => s + r.totalHours, 0) + thisHours;
  const { isOverloaded, isUnderloaded } = computeLoadFlags(
    newTotal,
    targetFaculty.maxWeeklyHours,
    targetFaculty.minWeeklyHours,
  );

  if (siblings.length > 0) {
    await prisma.workloadRecord.updateMany({
      where: { id: { in: siblings.map((r) => r.id) } },
      data: { isOverloaded, isUnderloaded },
    });
  }

  // If faculty or semester changed, recalculate the OLD faculty/semester group's remaining records
  const facultyChanged = isKeyChange && data.facultyId && data.facultyId !== record.facultyId;
  const semesterChanged = isKeyChange && data.semesterId && data.semesterId !== record.semesterId;

  if (facultyChanged || semesterChanged) {
    // Determine old faculty for load limits
    const oldFacultyForLimits = facultyChanged
      ? record.faculty
      : (await prisma.user.findUnique({ where: { id: record.facultyId }, select: { maxWeeklyHours: true, minWeeklyHours: true } }));

    const oldSiblings = await prisma.workloadRecord.findMany({
      where: {
        facultyId: record.facultyId,
        semesterId: record.semesterId,
        status: { not: 'CANCELLED' },
        id: { not: id },
      },
      select: { id: true, totalHours: true },
    });
    if (oldSiblings.length > 0 && oldFacultyForLimits) {
      const oldTotal = oldSiblings.reduce((s, r) => s + r.totalHours, 0);
      const oldFlags = computeLoadFlags(oldTotal, oldFacultyForLimits.maxWeeklyHours, oldFacultyForLimits.minWeeklyHours);
      await prisma.workloadRecord.updateMany({
        where: { id: { in: oldSiblings.map((r) => r.id) } },
        data: { isOverloaded: oldFlags.isOverloaded, isUnderloaded: oldFlags.isUnderloaded },
      });
    }
  }

  const updatedRecord = await prisma.workloadRecord.update({
    where: { id },
    data: {
      ...(data.facultyId && { facultyId: data.facultyId }),
      ...(data.courseId && { courseId: data.courseId }),
      ...(data.semesterId && { semesterId: data.semesterId }),
      ...merged,
      ...(data.groupCodes !== undefined && { groupCodes: data.groupCodes }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.status && { status: data.status }),
      totalHours: thisHours,
      isOverloaded,
      isUnderloaded,

      // Existing Prisma fields
      ...(data.teachingLanguage !== undefined && { teachingLanguage: data.teachingLanguage }),
      ...(data.weekCount !== undefined && { weekCount: data.weekCount }),

      // New fields
      ...(data.yearOfStudy !== undefined && { yearOfStudy: data.yearOfStudy }),
      ...(data.semesterNumbers !== undefined && { semesterNumbers: data.semesterNumbers }),
      ...(data.program !== undefined && { program: data.program }),
      ...(data.courseType !== undefined && { courseType: data.courseType }),
      ...(data.courseECTS !== undefined && { courseECTS: data.courseECTS }),
      ...(data.semesterECTS !== undefined && { semesterECTS: data.semesterECTS }),
      ...(data.responsibleDepartment !== undefined && { responsibleDepartment: data.responsibleDepartment }),
      ...(data.lectureGroup !== undefined && { lectureGroup: data.lectureGroup }),
      ...(data.tutorialGroup !== undefined && { tutorialGroup: data.tutorialGroup }),
      ...(data.totalCoveredTutorialHours !== undefined && { totalCoveredTutorialHours: data.totalCoveredTutorialHours }),
      ...(data.totalCoveredLectureHours !== undefined && { totalCoveredLectureHours: data.totalCoveredLectureHours }),
      ...(data.uncoveredHours !== undefined && { uncoveredHours: data.uncoveredHours }),
      ...(data.lecturesAndTutorialsNo !== undefined && { lecturesAndTutorialsNo: data.lecturesAndTutorialsNo }),
      ...(data.school !== undefined && { school: data.school }),
      ...(data.planningRowId !== undefined && { planningRowId: data.planningRowId }),

      // Assigned hours (professor-specific)
      ...(data.assignedLectureHours !== undefined && { assignedLectureHours: data.assignedLectureHours }),
      ...(data.assignedTutorialHours !== undefined && { assignedTutorialHours: data.assignedTutorialHours }),
      ...(data.assignedLabHours !== undefined && { assignedLabHours: data.assignedLabHours }),
      // If admin is reassigning hours to a previously REJECTED record, reset to PENDING
      ...((data.assignedLectureHours !== undefined || data.assignedTutorialHours !== undefined || data.assignedLabHours !== undefined)
        && record.approvalStatus === 'REJECTED'
        && { approvalStatus: 'PENDING' as const, rejectionReason: null }),
    },
    include: INCLUDE,
  });

  // ── If assigned hours changed, resync covered/uncovered across all records for this course+semester ──
  if (
    data.assignedLectureHours !== undefined ||
    data.assignedTutorialHours !== undefined ||
    data.assignedLabHours !== undefined
  ) {
    await resyncCoveredHours(updatedRecord.courseId, updatedRecord.semesterId);
    // Reload to get resynced values
    const reloaded = await prisma.workloadRecord.findUnique({ where: { id }, include: INCLUDE });
    return reloaded!;
  }

  // ── Recalculate PlanningRow if linked ───────────────────────────────────────
  if (updatedRecord.planningRowId) {
    await recalculatePlanningRow(updatedRecord.planningRowId);
  }

  await prisma.workloadEditHistory.create({
    data: {
      workloadRecordId: id,
      editedById: user.userId,
      editedByRole: user.role,
    },
  });

  const result = await prisma.workloadRecord.findUnique({ where: { id }, include: INCLUDE });

  // Notify the faculty about the update
  if (result) {
    await createNotification(
      result.facultyId,
      NotificationType.SYSTEM_ALERT,
      'Workload Updated',
      `Your workload for ${result.course?.courseCode || 'a course'} has been updated. Changes: ${changeSummary}`,
      { workloadId: result.id, courseCode: result.course?.courseCode, semesterName: result.semester?.name, changes, details },
    );
  }

  // Cross-notify: editor is HEAD → notify ADMINs; editor is ADMIN → notify dept HEAD
  if (result) {
    if (user.role === Role.DEPARTMENT_HEAD) {
      const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });
      await Promise.all(
        admins.map((admin) =>
          createNotification(
            admin.id,
            NotificationType.SYSTEM_ALERT,
            'Workload Updated by Department Head',
            `A workload for ${result.course?.courseCode || 'a course'} has been updated by a department head. Changes: ${changeSummary}`,
            { workloadId: result.id, courseCode: result.course?.courseCode, semesterName: result.semester?.name, updatedById: user.userId, changes, details },
          ),
        ),
      );
    } else if (user.role === Role.ADMIN && result.faculty) {
      const profDept2 = (result.faculty as any).facultyDepartment as string | undefined;
      const heads = await prisma.user.findMany({
        where: {
          role: Role.DEPARTMENT_HEAD,
          isActive: true,
          ...(profDept2 ? { facultyDepartment: profDept2 } : result.faculty.departmentId ? { departmentId: result.faculty.departmentId } : {}),
        },
        select: { id: true },
      });
      const profName2 = `${result.faculty.firstName} ${result.faculty.lastName}`;
      await Promise.all(
        heads.map((head) =>
          createNotification(
            head.id,
            NotificationType.SYSTEM_ALERT,
            'Workload Updated by Admin',
            `Admin updated a workload for ${profName2} (${result.course?.courseCode || 'a course'}) in your department. Changes: ${changeSummary}`,
            { workloadId: result.id, courseCode: result.course?.courseCode, semesterName: result.semester?.name, updatedById: user.userId, changes, details },
          ),
        ),
      );
    }
  }

  return result;
}

export async function remove(id: string, user: AuthUser) {
  const record = await prisma.workloadRecord.findUnique({
    where: { id },
    include: { faculty: true, course: { select: { courseCode: true, title: true } }, semester: { select: { name: true } } },
  });
  if (!record) throw ApiError.notFound('Workload record not found');

  // Nullify optional workloadId on requests before deleting (avoids FK constraint error)
  const planningRowId = record.planningRowId;
  await prisma.request.updateMany({ where: { workloadId: id }, data: { workloadId: null } });
  await prisma.workloadRecord.delete({ where: { id } });

  // ── Recalculate PlanningRow if linked ───────────────────────────────────────
  if (planningRowId) {
    await recalculatePlanningRow(planningRowId);
  }

  await createNotification(
    record.facultyId,
    NotificationType.SYSTEM_ALERT,
    'Workload Removed',
    `Your workload for ${record.course?.courseCode || 'a course'} has been removed.`,
    { workloadId: id, courseCode: record.course?.courseCode, semesterName: record.semester?.name },
  );

  // Cross-notify: HEAD deleted → notify ADMINs; ADMIN deleted → notify dept HEAD
  if (user.role === Role.DEPARTMENT_HEAD) {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          NotificationType.SYSTEM_ALERT,
          'Workload Removed by Department Head',
          `A workload for ${record.course?.courseCode || 'a course'} has been removed by a department head.`,
          { workloadId: id, courseCode: record.course?.courseCode, semesterName: record.semester?.name, removedById: user.userId },
        ),
      ),
    );
  } else if (user.role === Role.ADMIN && record.faculty?.departmentId) {
    const heads = await prisma.user.findMany({
      where: { role: Role.DEPARTMENT_HEAD, departmentId: record.faculty.departmentId, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      heads.map((head) =>
        createNotification(
          head.id,
          NotificationType.SYSTEM_ALERT,
          'Workload Removed by Admin',
          `A workload for ${record.course?.courseCode || 'a course'} in your department has been removed by admin.`,
          { workloadId: id, courseCode: record.course?.courseCode, semesterName: record.semester?.name, removedById: user.userId },
        ),
      ),
    );
  }

  const remaining = await prisma.workloadRecord.findMany({
    where: { facultyId: record.facultyId, semesterId: record.semesterId, status: { not: 'CANCELLED' } },
    select: { id: true, totalHours: true },
  });
  if (remaining.length > 0) {
    const newTotal = remaining.reduce((s, r) => s + r.totalHours, 0);
    const { isOverloaded, isUnderloaded } = computeLoadFlags(
      newTotal,
      record.faculty.maxWeeklyHours,
      record.faculty.minWeeklyHours,
    );
    await prisma.workloadRecord.updateMany({
      where: { id: { in: remaining.map((r) => r.id) } },
      data: { isOverloaded, isUnderloaded },
    });
  }
}

export async function resyncAllFlags() {
  const groups = await prisma.workloadRecord.groupBy({
    by: ['facultyId', 'semesterId'],
    where: { status: { not: 'CANCELLED' } },
  });

  for (const { facultyId, semesterId } of groups) {
    const faculty = await prisma.user.findUnique({
      where: { id: facultyId },
      select: { maxWeeklyHours: true, minWeeklyHours: true },
    });
    if (!faculty) continue;

    const records = await prisma.workloadRecord.findMany({
      where: { facultyId, semesterId, status: { not: 'CANCELLED' } },
      select: { id: true, totalHours: true },
    });
    const total = records.reduce((s, r) => s + r.totalHours, 0);
    const { isOverloaded, isUnderloaded } = computeLoadFlags(total, faculty.maxWeeklyHours, faculty.minWeeklyHours);

    await prisma.workloadRecord.updateMany({
      where: { id: { in: records.map((r) => r.id) } },
      data: { isOverloaded, isUnderloaded },
    });
  }
  console.log(`✅ Workload flags resynced for ${groups.length} faculty-semester groups`);
}

export async function approveWorkload(id: string, userId: string) {
  const record = await prisma.workloadRecord.findUnique({
    where: { id },
    include: {
      course: { select: { courseCode: true, title: true } },
      semester: { select: { name: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!record) throw ApiError.notFound('Workload record not found');
  if (record.facultyId !== userId) throw ApiError.forbidden('You can only respond to your own workloads');
  if (record.approvalStatus !== 'PENDING') throw ApiError.badRequest('This workload is no longer pending approval');

  const updated = await prisma.workloadRecord.update({
    where: { id },
    data: { approvalStatus: 'APPROVED', rejectionReason: null },
  });

  // Notify the admin/head who assigned it
  if (record.assignedById) {
    await createNotification(
      record.assignedById,
      NotificationType.REQUEST_APPROVED,
      'Workload Accepted',
      `${record.course?.courseCode || 'A course'} workload has been accepted by the professor for ${record.semester?.name || 'the semester'}.`,
      { workloadId: id, courseCode: record.course?.courseCode },
    );
  }

  return updated;
}

export async function rejectWorkload(id: string, userId: string, reason: string) {
  const record = await prisma.workloadRecord.findUnique({
    where: { id },
    include: {
      course: { select: { courseCode: true, title: true } },
      semester: { select: { name: true } },
      faculty: { select: { id: true, firstName: true, lastName: true, departmentId: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!record) throw ApiError.notFound('Workload record not found');
  if (record.facultyId !== userId) throw ApiError.forbidden('You can only respond to your own workloads');
  if (record.approvalStatus !== 'PENDING') throw ApiError.badRequest('This workload is no longer pending approval');

  const updated = await prisma.workloadRecord.update({
    where: { id },
    data: { approvalStatus: 'REJECTED', rejectionReason: reason },
  });

  const courseCode = record.course?.courseCode || 'Course';
  const semesterName = record.semester?.name || 'semester';
  const professorName = `${record.faculty?.firstName || ''} ${record.faculty?.lastName || ''}`.trim();
  const notifTitle = 'Workload Declined by Professor';
  const notifMsg = `${professorName} declined the workload for ${courseCode} (${semesterName}). Reason: ${reason}`;
  const notifMeta = { workloadId: id, courseCode, reason };

  // Create a visible Request so admin/head can review it
  await prisma.request.create({
    data: {
      type: 'WORKLOAD_DECLINED' as any,
      subject: `Workload Declined: ${courseCode} — ${semesterName}`,
      description: reason,
      status: 'PENDING',
      submittedById: userId,
      workloadId: id,
    },
  });

  // Notify original assigner
  if (record.assignedById) {
    await createNotification(record.assignedById, NotificationType.REQUEST_REJECTED, notifTitle, notifMsg, notifMeta);
  }

  // Notify ALL admins
  const admins = await prisma.user.findMany({ where: { role: Role.ADMIN, isActive: true }, select: { id: true } });
  await Promise.all(admins.map((a) => createNotification(a.id, NotificationType.REQUEST_REJECTED, notifTitle, notifMsg, notifMeta)));

  // Notify department heads of the professor's department
  if (record.faculty?.departmentId) {
    const heads = await prisma.user.findMany({
      where: { role: Role.DEPARTMENT_HEAD, departmentId: record.faculty.departmentId, isActive: true },
      select: { id: true },
    });
    await Promise.all(heads.map((h) => createNotification(h.id, NotificationType.REQUEST_REJECTED, notifTitle, notifMsg, notifMeta)));
  }

  return updated;
}
