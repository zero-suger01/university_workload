import { Role, RequestStatus, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { createNotification } from '../notifications/notifications.service';
import type { AuthUser } from '../../middleware/authenticate';
import type { CreateRequestInput } from './requests.schema';

const INCLUDE = {
  submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
  workload: { include: { course: { select: { courseCode: true, title: true } } } },
};

export async function getAll(user: AuthUser, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const status = query.status as RequestStatus | undefined;
  const type = query.type as string | undefined;

  let where: Record<string, unknown> = {
    ...(status && { status }),
    ...(type && { type }),
  };

  if (user.role === Role.FACULTY) {
    where.submittedById = user.userId;
  } else if (user.role === Role.DEPARTMENT_HEAD) {
    where.submittedBy = { departmentId: user.departmentId };
  }

  const [total, requests] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      include: INCLUDE,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { requests, meta: buildMeta(total, page, limit) };
}

export async function getById(id: string, user: AuthUser) {
  const req = await prisma.request.findUnique({ where: { id }, include: INCLUDE });
  if (!req) throw ApiError.notFound('Request not found');

  if (user.role === Role.FACULTY && req.submittedById !== user.userId) {
    throw ApiError.forbidden();
  }

  return req;
}

export async function create(data: CreateRequestInput, userId: string) {
  const request = await prisma.request.create({
    data: { ...data, submittedById: userId },
    include: INCLUDE,
  });

  // Notify the submitter
  await createNotification(
    userId,
    NotificationType.REQUEST_SUBMITTED,
    'Request Submitted',
    `Your request for ${request.workload?.course?.courseCode || 'a course'} has been submitted.`,
    { requestId: request.id, courseCode: request.workload?.course?.courseCode },
  );

  // Notify admins and heads
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEPARTMENT_HEAD'] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification(
        admin.id,
        NotificationType.REQUEST_SUBMITTED,
        'New Request Received',
        `A new request has been submitted for ${request.workload?.course?.courseCode || 'a course'}.`,
        { requestId: request.id, courseCode: request.workload?.course?.courseCode, submittedById: userId },
      ),
    ),
  );

  return request;
}

export async function approve(id: string, reviewNotes: string, reviewerId: string) {
  const req = await prisma.request.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Request not found');
  if (req.status !== 'PENDING' && req.status !== 'UNDER_REVIEW') {
    throw ApiError.badRequest('Request is already resolved');
  }

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: RequestStatus.APPROVED,
      reviewNotes,
      reviewedById: reviewerId,
      resolvedAt: new Date(),
    },
    include: INCLUDE,
  });

  // Notify the submitter
  await createNotification(
    req.submittedById,
    NotificationType.REQUEST_APPROVED,
    'Request Approved',
    `Your request has been approved${reviewNotes ? `: ${reviewNotes}` : '.'}`,
    { requestId: id, reviewNotes },
  );

  // Cross-notify: HEAD approved → notify ADMINs; ADMIN approved → notify dept HEAD
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { role: true, firstName: true, lastName: true },
  });

  if (reviewer?.role === Role.DEPARTMENT_HEAD) {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          NotificationType.REQUEST_APPROVED,
          'Request Approved by Department Head',
          `${reviewer.firstName} ${reviewer.lastName} approved a faculty request${reviewNotes ? `: ${reviewNotes}` : '.'}`,
          { requestId: id, reviewNotes, reviewedById: reviewerId },
        ),
      ),
    );
  } else if (reviewer?.role === Role.ADMIN) {
    const submitter = await prisma.user.findUnique({
      where: { id: req.submittedById },
      select: { departmentId: true },
    });
    if (submitter?.departmentId) {
      const heads = await prisma.user.findMany({
        where: { role: Role.DEPARTMENT_HEAD, departmentId: submitter.departmentId, isActive: true },
        select: { id: true },
      });
      await Promise.all(
        heads.map((head) =>
          createNotification(
            head.id,
            NotificationType.REQUEST_APPROVED,
            'Request Approved by Admin',
            `Admin approved a faculty request in your department${reviewNotes ? `: ${reviewNotes}` : '.'}`,
            { requestId: id, reviewNotes, reviewedById: reviewerId },
          ),
        ),
      );
    }
  }

  return updated;
}

export async function remove(id: string, user: AuthUser) {
  const req = await prisma.request.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Request not found');

  if (user.role === Role.FACULTY) {
    if (req.submittedById !== user.userId) throw ApiError.forbidden();
    if (req.status !== 'PENDING') throw ApiError.badRequest('Only pending requests can be deleted');
  }

  await prisma.request.delete({ where: { id } });
}

export async function bulkRemove(ids: string[], user: AuthUser) {
  if (user.role === Role.FACULTY) throw ApiError.forbidden();
  await prisma.request.deleteMany({ where: { id: { in: ids } } });
}

export async function reject(id: string, reviewNotes: string, reviewerId: string) {
  const req = await prisma.request.findUnique({ where: { id } });
  if (!req) throw ApiError.notFound('Request not found');
  if (req.status !== 'PENDING' && req.status !== 'UNDER_REVIEW') {
    throw ApiError.badRequest('Request is already resolved');
  }

  const updated = await prisma.request.update({
    where: { id },
    data: {
      status: RequestStatus.REJECTED,
      reviewNotes,
      reviewedById: reviewerId,
      resolvedAt: new Date(),
    },
    include: INCLUDE,
  });

  // Notify the submitter
  await createNotification(
    req.submittedById,
    NotificationType.REQUEST_REJECTED,
    'Request Rejected',
    `Your request has been rejected${reviewNotes ? `: ${reviewNotes}` : '.'}`,
    { requestId: id, reviewNotes },
  );

  // Cross-notify: HEAD rejected → notify ADMINs; ADMIN rejected → notify dept HEAD
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { role: true, firstName: true, lastName: true },
  });

  if (reviewer?.role === Role.DEPARTMENT_HEAD) {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          NotificationType.REQUEST_REJECTED,
          'Request Rejected by Department Head',
          `${reviewer.firstName} ${reviewer.lastName} rejected a faculty request${reviewNotes ? `: ${reviewNotes}` : '.'}`,
          { requestId: id, reviewNotes, reviewedById: reviewerId },
        ),
      ),
    );
  } else if (reviewer?.role === Role.ADMIN) {
    const submitter = await prisma.user.findUnique({
      where: { id: req.submittedById },
      select: { departmentId: true },
    });
    if (submitter?.departmentId) {
      const heads = await prisma.user.findMany({
        where: { role: Role.DEPARTMENT_HEAD, departmentId: submitter.departmentId, isActive: true },
        select: { id: true },
      });
      await Promise.all(
        heads.map((head) =>
          createNotification(
            head.id,
            NotificationType.REQUEST_REJECTED,
            'Request Rejected by Admin',
            `Admin rejected a faculty request in your department${reviewNotes ? `: ${reviewNotes}` : '.'}`,
            { requestId: id, reviewNotes, reviewedById: reviewerId },
          ),
        ),
      );
    }
  }

  return updated;
}
