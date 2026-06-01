// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import type { GroupInput } from './groups.schema';

export async function getByPlanningRow(planningRowId: string) {
  return prisma.group.findMany({
    where: { planningRowId },
    include: {
      workloadRecords: {
        include: { faculty: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getById(id: string) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      planningRow: {
        include: {
          course: { select: { id: true, courseCode: true, title: true } },
          semester: { select: { id: true, name: true } },
        },
      },
      workloadRecords: {
        include: { faculty: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });
  if (!group) throw ApiError.notFound('Group not found');
  return group;
}

export async function create(data: GroupInput) {
  return prisma.group.create({
    data,
    include: {
      planningRow: { select: { id: true } },
      program: { select: { id: true, name: true } },
    },
  });
}

export async function bulkCreate(planningRowId: string, programId: string, groups: Omit<GroupInput, 'planningRowId' | 'programId'>[]) {
  return prisma.$transaction(
    groups.map(g => prisma.group.create({ data: { ...g, planningRowId, programId } })),
  );
}

export async function update(id: string, data: Partial<GroupInput>) {
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) throw ApiError.notFound('Group not found');
  return prisma.group.update({ where: { id }, data });
}

export async function remove(id: string) {
  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) throw ApiError.notFound('Group not found');
  await prisma.group.delete({ where: { id } });
}
