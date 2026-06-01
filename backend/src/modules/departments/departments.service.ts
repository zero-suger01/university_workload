import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export async function getAll() {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { users: true, courses: true } } },
  });
}

export async function getById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true, courses: true } } },
  });
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
}

export async function create(data: { name: string; code: string; description?: string; avgWeeklyLoad?: number }) {
  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: data.name }, { code: data.code }] },
  });
  if (existing) throw ApiError.conflict('Department name or code already exists');
  return prisma.department.create({ data });
}

export async function update(id: string, data: Partial<{ name: string; code: string; description: string; avgWeeklyLoad: number }>) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw ApiError.notFound('Department not found');
  return prisma.department.update({ where: { id }, data });
}

export async function remove(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true, courses: true } } },
  });
  if (!dept) throw ApiError.notFound('Department not found');

  if (dept._count.users > 0 || dept._count.courses > 0) {
    throw ApiError.conflict(
      `Cannot delete: department has ${dept._count.users} user(s) and ` +
      `${dept._count.courses} course(s). Reassign or remove them first.`,
    );
  }

  // Cascade-delete programs and all their dependent data in a transaction
  await prisma.$transaction(async (tx) => {
    const programs = await tx.program.findMany({ where: { departmentId: id }, select: { id: true } });
    const programIds = programs.map((p) => p.id);

    if (programIds.length > 0) {
      // Null out faculty program assignments
      await tx.user.updateMany({ where: { programId: { in: programIds } }, data: { programId: null } });
      // Remove student cohorts
      await tx.studentCohort.deleteMany({ where: { programId: { in: programIds } } });

      // Handle planning rows (WorkloadAssignment cascades via onDelete:Cascade)
      const planningRows = await tx.planningRow.findMany({
        where: { programId: { in: programIds } },
        select: { id: true },
      });
      const rowIds = planningRows.map((r) => r.id);
      if (rowIds.length > 0) {
        // Null out workload records that reference these rows
        await tx.workloadRecord.updateMany({ where: { planningRowId: { in: rowIds } }, data: { planningRowId: null } });
        // Delete groups tied to planning rows
        await tx.group.deleteMany({ where: { planningRowId: { in: rowIds } } });
        // WorkloadAssignments auto-cascade; delete rows
        await tx.planningRow.deleteMany({ where: { id: { in: rowIds } } });
      }

      // Delete remaining groups tied directly to the program
      await tx.group.deleteMany({ where: { programId: { in: programIds } } });

      // Delete curriculum items then curricula
      const curricula = await tx.curriculum.findMany({ where: { programId: { in: programIds } }, select: { id: true } });
      const curriculumIds = curricula.map((c) => c.id);
      if (curriculumIds.length > 0) {
        await tx.curriculumItem.deleteMany({ where: { curriculumId: { in: curriculumIds } } });
        await tx.curriculum.deleteMany({ where: { id: { in: curriculumIds } } });
      }

      await tx.program.deleteMany({ where: { departmentId: id } });
    }

    // Clean up other department-level records
    await tx.vacancyRecord.deleteMany({ where: { departmentId: id } });
    await tx.staffUnit.deleteMany({ where: { departmentId: id } });
    // Null out rooms that reference this department (departmentId is optional on Room)
    await tx.room.updateMany({ where: { departmentId: id }, data: { departmentId: null } });

    await tx.department.delete({ where: { id } });
  });
}
