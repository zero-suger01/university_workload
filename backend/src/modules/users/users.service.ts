import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role, NotificationType } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { createNotification } from '../notifications/notifications.service';
import type { CreateUserInput, UpdateUserInput } from './users.schema';
import { sendWelcomeEmail } from '../../utils/emailService';

function generatePassword(length = 10): string {
  // Exclude visually ambiguous chars: 0/O, 1/I/l
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length))
    .map((b) => chars[b % chars.length])
    .join('');
}

const SELECT_SAFE = {
  id: true,
  employeeId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  profilePhoto: true,
  phoneNumber: true,
  isActive: true,
  maxWeeklyHours: true,
  minWeeklyHours: true,
  gender: true,
  academicPosition: true,
  employmentType: true,
  departmentId: true,
  department: { select: { id: true, name: true, code: true } },
  facultyDepartment: true,
  programId: true,
  program: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
};

export async function getUsers(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = query.search as string | undefined;
  const role = query.role as Role | undefined;
  const departmentId = query.departmentId as string | undefined;
  const isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;

  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { employeeId: { contains: search, mode: 'insensitive' as const } },
        { department: { name: { contains: search, mode: 'insensitive' as const } } },
        { facultyDepartment: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(role && { role }),
    ...(departmentId && { departmentId }),
    ...(isActive !== undefined && { isActive }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    // tempPassword included here only: the list route is admin/head-guarded,
    // unlike GET /users/:id which any authenticated user can call
    prisma.user.findMany({ where, select: { ...SELECT_SAFE, tempPassword: true }, skip, take: limit, orderBy: { lastName: 'asc' } }),
  ]);

  return { users, meta: buildMeta(total, page, limit) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: SELECT_SAFE });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function createUser(data: CreateUserInput, adminEmail?: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { employeeId: data.employeeId }] },
  });
  if (existing) throw ApiError.conflict('Email or employee ID already in use');

  const plainPassword = data.password ?? generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  const { password, ...rest } = data;

  let departmentId = rest.departmentId;
  if (!departmentId) {
    const firstDept = await prisma.department.findFirst({ select: { id: true } });
    if (!firstDept) throw ApiError.badRequest('No departments exist in the system.');
    departmentId = firstDept.id;
  }

  // Prisma expects undefined instead of null for optional fields
  const createData: Record<string, unknown> = { ...rest, departmentId, passwordHash, tempPassword: plainPassword };
  for (const [key, value] of Object.entries(createData)) {
    if (value === null || value === undefined || value === '') delete createData[key];
  }

  const user = await prisma.user.create({
    data: createData as any,
    select: SELECT_SAFE,
  });

  // Send welcome email (fire-and-forget — don't block the response)
  sendWelcomeEmail({
    to: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    password: plainPassword,
    adminEmail,
  }).catch((err) => console.error('[EmailService] Failed to send welcome email:', err));

  // Notify the new user
  await createNotification(
    user.id,
    NotificationType.SYSTEM_ALERT,
    'Welcome!',
    `Your account has been created. Welcome to the workload management system!`,
    { userId: user.id },
  );

  return user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  // Prisma expects undefined instead of null for optional fields
  const { password, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(updateData)) {
    if (value === null || value === undefined || value === '') delete updateData[key];
  }

  // Password provided in edit form — actually apply it and refresh the
  // Password Directory entry, then email (or console-log in dev) the credentials
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
    updateData.tempPassword = password;
    sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password,
    }).catch((err) => console.error('[EmailService] Failed to send password email:', err));
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData as any,
    select: SELECT_SAFE,
  });

  await createNotification(
    id,
    NotificationType.SYSTEM_ALERT,
    'Profile Updated',
    'Your profile information has been updated.',
    { userId: id },
  );

  return updated;
}

export async function getUserRelatedCounts(id: string) {
  const [workloadRecords, workloadAssignments, submittedRequests, generatedReports, cqiReports] =
    await Promise.all([
      prisma.workloadRecord.count({ where: { facultyId: id } }),
      prisma.workloadAssignment.count({ where: { facultyId: id } }),
      prisma.request.count({ where: { submittedById: id } }),
      prisma.report.count({ where: { generatedById: id } }),
      prisma.cQIReport.count({ where: { facultyId: id } }),
    ]);
  return { workloadRecords, workloadAssignments, submittedRequests, generatedReports, cqiReports };
}

export async function deleteUser(id: string, force = false) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound('User not found');

  if (force) {
    // Cascade: remove all related records in dependency order, then the user
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.auditLog.deleteMany({ where: { performedById: id } }),
      prisma.cQIReport.deleteMany({ where: { facultyId: id } }),
      prisma.workloadRecord.deleteMany({ where: { facultyId: id } }),
      prisma.workloadAssignment.deleteMany({ where: { facultyId: id } }),
      prisma.request.deleteMany({ where: { submittedById: id } }),
      prisma.request.deleteMany({ where: { reviewedById: id } }),
      prisma.report.deleteMany({ where: { generatedById: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
    return;
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'P2003' || code === 'P2014') {
      throw ApiError.conflict(
        'This user has attached records. Use force=true to permanently delete everything.',
      );
    }
    throw err;
  }
}
