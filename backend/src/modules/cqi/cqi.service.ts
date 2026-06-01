// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const baseInclude = {
  course: { select: { id: true, courseCode: true, title: true } },
  semester: { select: { id: true, name: true, academicYear: true, term: true } },
  faculty: { select: { id: true, firstName: true, lastName: true, academicPosition: true } },
};

const fullInclude = {
  ...baseInclude,
  syllabus: { orderBy: { week: 'asc' } },
  cloAssessments: { orderBy: { cloNumber: 'asc' } },
};

export async function getAll(semesterId?: string, facultyId?: string, status?: string) {
  return prisma.cQIReport.findMany({
    where: {
      ...(semesterId && { semesterId }),
      ...(facultyId && { facultyId }),
      ...(status && { status: status as any }),
    },
    include: baseInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getById(id: string) {
  const report = await prisma.cQIReport.findUnique({
    where: { id },
    include: fullInclude,
  });
  if (!report) throw ApiError.notFound('CQI report not found');
  return report;
}

export async function create(facultyId: string, data: any) {
  const { syllabus, cloAssessments, ...rest } = data;

  return prisma.cQIReport.create({
    data: {
      ...rest,
      facultyId,
      textbooks: rest.textbooks ?? [],
      ...(syllabus && {
        syllabus: {
          create: syllabus.map((w: any) => ({
            week: w.week,
            date: w.date,
            topic: w.topic,
            tutorials: w.tutorials,
          })),
        },
      }),
      ...(cloAssessments && {
        cloAssessments: {
          create: cloAssessments.map((c: any) => ({
            cloNumber: c.cloNumber,
            description: c.description,
            teachingMethods: c.teachingMethods ?? [],
            assessmentTools: c.assessmentTools ?? [],
            perfHigh: c.perfHigh,
            perfMedium: c.perfMedium,
            perfLow: c.perfLow,
            plosHigh: c.plosHigh ?? [],
            plosMedium: c.plosMedium ?? [],
            plosLow: c.plosLow ?? [],
          })),
        },
      }),
    },
    include: fullInclude,
  });
}

export async function update(id: string, data: any) {
  const report = await prisma.cQIReport.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound('CQI report not found');
  if (report.status !== 'DRAFT' && report.status !== 'REVISION_NEEDED') {
    throw ApiError.badRequest('Only DRAFT or REVISION_NEEDED reports can be updated');
  }

  const { syllabus, cloAssessments, ...rest } = data;

  // Upsert syllabus items if provided
  if (syllabus) {
    for (const w of syllabus) {
      await prisma.weeklySyllabus.upsert({
        where: { cqiId_week: { cqiId: id, week: w.week } },
        update: { date: w.date, topic: w.topic, tutorials: w.tutorials },
        create: { cqiId: id, week: w.week, date: w.date, topic: w.topic, tutorials: w.tutorials },
      });
    }
  }

  // Upsert CLO assessments if provided
  if (cloAssessments) {
    for (const c of cloAssessments) {
      await prisma.cLOAssessment.upsert({
        where: { cqiId_cloNumber: { cqiId: id, cloNumber: c.cloNumber } },
        update: {
          description: c.description,
          teachingMethods: c.teachingMethods ?? [],
          assessmentTools: c.assessmentTools ?? [],
          perfHigh: c.perfHigh,
          perfMedium: c.perfMedium,
          perfLow: c.perfLow,
          plosHigh: c.plosHigh ?? [],
          plosMedium: c.plosMedium ?? [],
          plosLow: c.plosLow ?? [],
        },
        create: {
          cqiId: id,
          cloNumber: c.cloNumber,
          description: c.description,
          teachingMethods: c.teachingMethods ?? [],
          assessmentTools: c.assessmentTools ?? [],
          perfHigh: c.perfHigh,
          perfMedium: c.perfMedium,
          perfLow: c.perfLow,
          plosHigh: c.plosHigh ?? [],
          plosMedium: c.plosMedium ?? [],
          plosLow: c.plosLow ?? [],
        },
      });
    }
  }

  return prisma.cQIReport.update({
    where: { id },
    data: rest,
    include: fullInclude,
  });
}

export async function submit(id: string) {
  const report = await prisma.cQIReport.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound('CQI report not found');
  if (report.status !== 'DRAFT' && report.status !== 'REVISION_NEEDED') {
    throw ApiError.badRequest('Only DRAFT or REVISION_NEEDED reports can be submitted');
  }
  return prisma.cQIReport.update({
    where: { id },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
    include: fullInclude,
  });
}

export async function approve(id: string, notes?: string) {
  const report = await prisma.cQIReport.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound('CQI report not found');
  return prisma.cQIReport.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), ...(notes && { reviewNotes: notes }) },
    include: fullInclude,
  });
}

export async function requestRevision(id: string, notes: string) {
  const report = await prisma.cQIReport.findUnique({ where: { id } });
  if (!report) throw ApiError.notFound('CQI report not found');
  return prisma.cQIReport.update({
    where: { id },
    data: { status: 'REVISION_NEEDED', reviewNotes: notes },
    include: fullInclude,
  });
}
