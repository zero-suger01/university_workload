// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export async function getByDepartmentAndSemester(departmentId: string, semesterId: string) {
  return prisma.staffUnit.findUnique({
    where: { departmentId_semesterId: { departmentId, semesterId } },
    include: {
      department: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true, academicYear: true } },
    },
  });
}

export async function getBySemester(semesterId: string) {
  return prisma.staffUnit.findMany({
    where: { semesterId },
    include: {
      department: { select: { id: true, name: true, code: true } },
      semester: { select: { id: true, name: true, academicYear: true } },
    },
    orderBy: { department: { name: 'asc' } },
  });
}

export async function recalculate(semesterId: string) {
  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) throw ApiError.notFound('Semester not found');

  // Get all departments
  const departments = await prisma.department.findMany({ select: { id: true } });

  // ── Source 1: WorkloadRecord (legacy admin-assigned) ─────────────────────────
  const workloadRecords = await prisma.workloadRecord.findMany({
    where: { semesterId, status: { not: 'CANCELLED' as any } },
    include: {
      course: { select: { departmentId: true } },
      faculty: { select: { id: true, departmentId: true, academicPosition: true } },
    },
  });

  // ── Source 2: WorkloadAssignment (head planning-based) ───────────────────────
  const workloadAssignments = await prisma.workloadAssignment.findMany({
    where: { planningRow: { semesterId } },
    include: {
      planningRow: {
        include: { course: { select: { departmentId: true } } },
      },
      faculty: { select: { id: true, departmentId: true, academicPosition: true } },
    },
  });

  type DeptEntry = {
    totalLectureHours: number;
    totalTutorialHours: number;
    totalLabHours: number;
    totalSeminarHours: number;
    totalAllHours: number;
    professorCount: number;
    docentCount: number;
    seniorLecturerCount: number;
    lecturerCount: number;
    facultyIds: Set<string>;
    countedFacultyIds: Set<string>;
  };

  const deptMap = new Map<string, DeptEntry>();
  for (const dept of departments) {
    deptMap.set(dept.id, {
      totalLectureHours: 0, totalTutorialHours: 0, totalLabHours: 0,
      totalSeminarHours: 0, totalAllHours: 0,
      professorCount: 0, docentCount: 0, seniorLecturerCount: 0, lecturerCount: 0,
      facultyIds: new Set(),
      countedFacultyIds: new Set(),
    });
  }

  function countPosition(entry: DeptEntry, facultyId: string, pos: string | null) {
    if (entry.countedFacultyIds.has(facultyId)) return;
    entry.countedFacultyIds.add(facultyId);
    if (pos === 'PROFESSOR' || pos === 'VISITING_PROFESSOR' || pos === 'ADJUNCT_PROFESSOR') {
      entry.professorCount++;
    } else if (pos === 'ASSOCIATE_PROFESSOR' || pos === 'ASSISTANT_PROFESSOR') {
      entry.docentCount++;
    } else if (pos === 'SENIOR_LECTURER') {
      entry.seniorLecturerCount++;
    } else if (pos === 'LECTURER' || pos === 'TEACHING_ASSISTANT' || pos === 'LAB_ASSISTANT') {
      entry.lecturerCount++;
    }
  }

  // ── Accumulate from WorkloadRecord ─────────────────────────────────────────
  for (const wr of workloadRecords) {
    const deptId = wr.course.departmentId;
    const entry = deptMap.get(deptId);
    if (!entry) continue;

    entry.totalLectureHours += wr.lectureHours || 0;
    entry.totalTutorialHours += wr.seminarHours || 0; // seminarHours maps to tutorial
    entry.totalLabHours += wr.labHours || 0;
    entry.totalAllHours += wr.totalHours || 0;
    entry.facultyIds.add(wr.facultyId);
    countPosition(entry, wr.facultyId, wr.faculty.academicPosition);
  }

  // ── Accumulate from WorkloadAssignment (planning flow) ─────────────────────
  // Track which (deptId, facultyId) pairs already came from WorkloadRecord to avoid
  // double-counting faculty that appear in both systems simultaneously
  const recordFacultyPerDept = new Map<string, Set<string>>();
  for (const wr of workloadRecords) {
    const deptId = wr.course.departmentId;
    if (!recordFacultyPerDept.has(deptId)) recordFacultyPerDept.set(deptId, new Set());
    recordFacultyPerDept.get(deptId)!.add(wr.facultyId);
  }

  for (const wa of workloadAssignments) {
    const deptId = wa.planningRow.course.departmentId;
    const entry = deptMap.get(deptId);
    if (!entry) continue;

    // Hours: always add assignment hours (they represent real teaching load)
    if (wa.assignType === 'LECTURE') entry.totalLectureHours += wa.totalHours || 0;
    else if (wa.assignType === 'TUTORIAL') entry.totalTutorialHours += wa.totalHours || 0;
    else if (wa.assignType === 'LAB') entry.totalLabHours += wa.totalHours || 0;
    entry.totalAllHours += wa.totalHours || 0;
    entry.facultyIds.add(wa.facultyId);

    // Position: only count if not already counted via WorkloadRecord for this dept
    const alreadyCounted = recordFacultyPerDept.get(deptId)?.has(wa.facultyId) ?? false;
    if (!alreadyCounted) {
      countPosition(entry, wa.facultyId, wa.faculty.academicPosition);
    }
  }

  const results = await prisma.$transaction(
    Array.from(deptMap.entries()).map(([departmentId, d]) => {
      const staffUnitsCount = d.facultyIds.size;
      // Auditoriya = classroom contact hours only (lec + tut + lab + seminar)
      const totalAuditoriyaHours = d.totalLectureHours + d.totalTutorialHours
        + d.totalLabHours + d.totalSeminarHours;
      // Derived loads: same coefficients as Kafedra Yuklama Excel formula
      const ratingHours  = Math.round(totalAuditoriyaHours * 0.2  * 10) / 10;
      const consultHours = Math.round(totalAuditoriyaHours * 0.005 * 10) / 10;
      // totalAllHours = auditoriya + rating + consult + rest (courseWork, practice, thesis)
      const totalAllHours = totalAuditoriyaHours + ratingHours + consultHours;
      const avgLoad = staffUnitsCount > 0 ? totalAllHours / staffUnitsCount : 0;

      const upsertData = {
        totalLectureHours: d.totalLectureHours,
        totalTutorialHours: d.totalTutorialHours,
        totalLabHours: d.totalLabHours,
        totalSeminarHours: d.totalSeminarHours,
        totalAuditoriyaHours,
        ratingHours,
        consultHours,
        totalAllHours,
        staffUnitsCount, avgLoad,
        professorCount: d.professorCount,
        docentCount: d.docentCount,
        seniorLecturerCount: d.seniorLecturerCount,
        lecturerCount: d.lecturerCount,
      };

      return prisma.staffUnit.upsert({
        where: { departmentId_semesterId: { departmentId, semesterId } },
        create: { departmentId, semesterId, ...upsertData },
        update: upsertData,
      });
    }),
  );

  return results;
}
