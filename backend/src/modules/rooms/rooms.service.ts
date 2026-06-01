// @ts-nocheck
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export async function getAll(roomType?: string, building?: string) {
  return prisma.room.findMany({
    where: {
      ...(roomType && { roomType: roomType as any }),
      ...(building && { building }),
    },
    orderBy: [{ building: 'asc' }, { number: 'asc' }],
  });
}

export async function getById(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
}

export async function create(data: any) {
  return prisma.room.create({ data });
}

export async function update(id: string, data: any) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw ApiError.notFound('Room not found');
  return prisma.room.update({ where: { id }, data });
}

export async function remove(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw ApiError.notFound('Room not found');
  await prisma.room.delete({ where: { id } });
}
