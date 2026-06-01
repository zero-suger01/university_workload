// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import {
  generateWorkloadExcel,
  generateOverloadExcel,
  generateDeptComparisonExcel,
  generateKafedraYuklamaExcel,
  generateShtatBirligiExcel,
  generatePasswordDirectoryExcel,
  type KafedraYuklamaRow,
  type ShtatBirligiRow,
} from './excel.generator';
import type { GenerateReportInput } from './reports.schema';

export async function generate(data: GenerateReportInput, generatedById: string) {
  const semester = data.semesterId
    ? await prisma.semester.findUnique({ where: { id: data.semesterId } })
    : null;

  const semName = semester?.name ?? 'All';
  const whereClause = data.semesterId ? { semesterId: data.semesterId } : {};

  let fileUrl: string | null = null;

  if (data.format === 'pdf') {
    // PDF export is not yet implemented — return a helpful error
    throw ApiError.badRequest('PDF export is not yet supported. Please use Excel format.');
  }

  // ── Excel reports ─────────────────────────────────────────────────────────
  if (data.type === 'workload_summary') {
    const workloads = await prisma.workloadRecord.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: {
            firstName: true, lastName: true, employeeId: true,
            maxWeeklyHours: true, minWeeklyHours: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const grouped = new Map<string, (typeof workloads)[0][]>();
    for (const w of workloads) {
      if (!grouped.has(w.facultyId)) grouped.set(w.facultyId, []);
      grouped.get(w.facultyId)!.push(w);
    }

    const rows = Array.from(grouped.entries()).map(([, recs]) => {
      const totalHours = recs.reduce((s, r) => s + r.totalHours, 0);
      const f = recs[0].faculty;
      return {
        faculty: { firstName: f.firstName, lastName: f.lastName, employeeId: f.employeeId },
        department: f.department.name,
        totalHours,
        courseCount: recs.length,
        isOverloaded: totalHours > f.maxWeeklyHours,
        isUnderloaded: totalHours < f.minWeeklyHours,
      };
    });

    fileUrl = await generateWorkloadExcel(rows, semName);

  } else if (data.type === 'overload') {
    const workloads = await prisma.workloadRecord.findMany({
      where: { ...whereClause, isOverloaded: true },
      include: {
        faculty: {
          select: {
            firstName: true, lastName: true, employeeId: true,
            maxWeeklyHours: true, minWeeklyHours: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const grouped = new Map<string, (typeof workloads)[0][]>();
    for (const w of workloads) {
      if (!grouped.has(w.facultyId)) grouped.set(w.facultyId, []);
      grouped.get(w.facultyId)!.push(w);
    }

    const rows = Array.from(grouped.entries()).map(([, recs]) => {
      const totalHours = recs.reduce((s, r) => s + r.totalHours, 0);
      const f = recs[0].faculty;
      return {
        faculty: { firstName: f.firstName, lastName: f.lastName, employeeId: f.employeeId },
        department: f.department.name,
        totalHours,
        maxHours: f.maxWeeklyHours,
        excessHours: Math.max(0, totalHours - f.maxWeeklyHours),
        courseCount: recs.length,
      };
    });

    fileUrl = await generateOverloadExcel(rows, semName);

  } else if (data.type === 'department_comparison') {
    const departments = await prisma.department.findMany({
      include: {
        users: {
          where: { role: 'FACULTY', isActive: true },
          include: {
            workloadRecords: { where: whereClause },
          },
        },
      },
    });

    const rows = departments.map((dept) => {
      const facultyWithWorkload = dept.users.filter((u) => u.workloadRecords.length > 0);
      const totalHours = facultyWithWorkload.reduce(
        (sum, u) => sum + u.workloadRecords.reduce((s, w) => s + w.totalHours, 0),
        0,
      );
      const avgHours = facultyWithWorkload.length > 0
        ? Math.round((totalHours / facultyWithWorkload.length) * 10) / 10
        : 0;

      return {
        department: dept.name,
        facultyCount: facultyWithWorkload.length,
        avgHours,
        totalHours,
        overloadedCount: facultyWithWorkload.filter((u) =>
          u.workloadRecords.some((w) => w.isOverloaded),
        ).length,
        underloadedCount: facultyWithWorkload.filter((u) =>
          u.workloadRecords.some((w) => w.isUnderloaded),
        ).length,
      };
    });

    fileUrl = await generateDeptComparisonExcel(rows, semName);
  }

  // ── Government Format: Kafedra Yuklama ──────────────────────────────────────
  if (data.type === 'kafedra_yuklama') {
    if (!data.semesterId) throw ApiError.badRequest('semesterId required for kafedra_yuklama report');
    if (!data.departmentId) throw ApiError.badRequest('departmentId required for kafedra_yuklama report');

    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw ApiError.notFound('Department not found');

    const planningRows = await prisma.planningRow.findMany({
      where: { semesterId: data.semesterId, course: { departmentId: data.departmentId } },
      include: {
        course: {
          select: {
            title: true, weeklyHours: true, type: true,
            weeklyLectureHours: true, weeklyTutorialHours: true, weeklyLabHours: true,
          },
        },
        program: { select: { name: true, code: true } },
        semester: { select: { name: true, academicYear: true, weekCount: true } },
      },
      orderBy: [{ yearOfStudy: 'asc' }, { semesterNumber: 'asc' }],
    });

    const rows: KafedraYuklamaRow[] = planningRows.map((row, i) => {
      const wc = row.semester.weekCount;
      const lecHrs  = row.course.weeklyLectureHours  || 0;
      const tutHrs  = row.course.weeklyTutorialHours || 0;
      const labHrs  = row.course.weeklyLabHours      || 0;
      return {
        rowNumber: i + 1,
        courseName: row.course.title,
        lectureHoursPerWeek:  lecHrs,
        tutorialHoursPerWeek: tutHrs,
        labHoursPerWeek:      labHrs,
        programCode: row.program.code,
        programName: row.program.name,
        teachingLanguage: row.teachingLanguage,
        formOfStudy: 'Kunduzgi',
        studentCount: row.studentCount,
        groupCount: row.lectureGroups + row.tutorialGroups + row.labGroups,
        subgroupCount: row.labGroups,
        weekCount: wc,
        lectureGroups: row.lectureGroups,
        tutorialGroups: row.tutorialGroups,
        labGroups: row.labGroups,
      };
    });

    const sem = planningRows[0]?.semester;
    fileUrl = await generateKafedraYuklamaExcel(
      dept.name, sem?.name ?? semName, sem?.academicYear ?? '', rows,
    );
  }

  // ── Government Format: Shtat Birligi ─────────────────────────────────────────
  if (data.type === 'shtat_birligi') {
    if (!data.semesterId) throw ApiError.badRequest('semesterId required for shtat_birligi report');

    const staffUnits = await prisma.staffUnit.findMany({
      where: { semesterId: data.semesterId },
      include: {
        department: { select: { name: true } },
        semester: { select: { name: true, academicYear: true } },
      },
      orderBy: { department: { name: 'asc' } },
    });

    const rows: ShtatBirligiRow[] = staffUnits.map(su => ({
      departmentName: su.department.name,
      lectureHours: su.totalLectureHours,
      tutorialHours: su.totalTutorialHours,
      labHours: su.totalLabHours,
      seminarHours: su.totalSeminarHours,
      ratingHours: su.ratingHours,       // auditoriya × 0.2  (pre-calculated in StaffUnit)
      consultHours: su.consultHours,     // auditoriya × 0.005 (pre-calculated in StaffUnit)
      courseWorkHours: su.courseWorkHours,
      practiceHours: su.practiceHours,
      thesisHours: su.thesisHours,
      mdDakHours: 0,
      bmiHours: 0,
      doktorantHours: 0,
      tarifiyCount: 0,
      assistantCount: 0,
      totalHours: su.totalAllHours,
      staffUnitsCount: su.staffUnitsCount,
      avgLoad: su.avgLoad,
      professorCount: su.professorCount,
      docentCount: su.docentCount,
      seniorLecturerCount: su.seniorLecturerCount,
      lecturerCount: su.lecturerCount,
    }));

    const sem = staffUnits[0]?.semester;
    const deptName = staffUnits.length === 1
      ? staffUnits[0].department.name
      : 'Барча кафедралар';
    fileUrl = await generateShtatBirligiExcel(
      'Низомий номидаги ЎМПУ', deptName, sem?.academicYear ?? '', rows,
    );
  }

  // ── Vacancy Forecast Report ───────────────────────────────────────────────────
  if (data.type === 'vacancy_forecast') {
    if (!data.semesterId) throw ApiError.badRequest('semesterId required');
    const { getForecast } = await import('../vacancy/vacancy.service');
    const forecast = await getForecast(data.semesterId, data.departmentId);

    const wb = new (await import('exceljs')).default.Workbook();
    const sh = wb.addWorksheet('Vacancy Forecast');
    sh.columns = [
      { header: 'Department', key: 'dept', width: 28 },
      { header: 'Required Hours', key: 'required', width: 16 },
      { header: 'Covered Hours', key: 'covered', width: 16 },
      { header: 'Uncovered Hours', key: 'uncovered', width: 16 },
      { header: 'Staff Needed', key: 'staff', width: 14 },
      { header: 'Coverage %', key: 'pct', width: 12 },
    ];
    sh.getRow(1).font = { bold: true };
    for (const r of forecast.byDepartment) {
      sh.addRow({
        dept: r.departmentName, required: r.totalRequired, covered: r.totalCovered,
        uncovered: r.uncoveredHours, staff: r.staffNeeded, pct: `${r.coveragePercent}%`,
      });
    }
    const dir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fileUrl = path.join(dir, `vacancy_${semName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
    await wb.xlsx.writeFile(fileUrl);
  }

  // ── Password Directory ───────────────────────────────────────────────────────
  if (data.type === 'password_directory') {
    const users = await prisma.user.findMany({
      where: { role: { in: ['FACULTY', 'DEPARTMENT_HEAD', 'ADMIN'] }, isActive: true },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        tempPassword: true,
        department: { select: { name: true } },
      },
      orderBy: [{ department: { name: 'asc' } }, { lastName: 'asc' }],
    });

    const rows = users.map((u) => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      department: u.department.name,
      tempPassword: u.tempPassword ?? 'N/A (Password Changed)',
    }));

    fileUrl = await generatePasswordDirectoryExcel(rows);
  }

  return prisma.report.create({
    data: {
      title: data.title,
      type: data.type,
      format: data.format,
      fileUrl,
      parameters: JSON.parse(JSON.stringify(data)),
      generatedById,
      semesterId: data.semesterId,
    },
  });
}

export async function getAll(generatedById: string) {
  return prisma.report.findMany({
    where: { generatedById },
    orderBy: { createdAt: 'desc' },
  });
}

export async function remove(id: string) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound('Report not found');

  if (report.fileUrl) {
    const absPath = path.isAbsolute(report.fileUrl) ? report.fileUrl : path.resolve(report.fileUrl);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  }

  return prisma.report.delete({ where: { id } });
}
