import { NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { parsePagination, buildMeta } from '../../utils/pagination';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: { userId, type, title, message, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
  });
}

export async function getForUser(userId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

  return { notifications, unreadCount, meta: buildMeta(total, page, limit) };
}

export async function markRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function remove(id: string, userId: string) {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
}

export async function removeAll(userId: string) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}
