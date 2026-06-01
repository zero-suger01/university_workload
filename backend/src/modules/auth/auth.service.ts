import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/tokenUtils';
import type { LoginInput } from './auth.schema';

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { department: { select: { id: true, name: true, code: true } } },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const payload = { userId: user.id, email: user.email, role: user.role, departmentId: user.departmentId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
  });

  const { passwordHash, refreshToken: _, passwordResetToken, passwordResetExpires, ...safeUser } =
    user;

  return { accessToken, refreshToken, user: safeUser };
}

export async function refresh(refreshToken: string) {
  let payload: { userId: string; email: string; role: string; departmentId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { department: { select: { id: true, name: true, code: true } } },
  });
  if (!user?.refreshToken || !user.isActive) {
    throw ApiError.unauthorized('Session expired');
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!valid) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const newPayload = { userId: user.id, email: user.email, role: user.role, departmentId: user.departmentId };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
  });

  const { passwordHash, refreshToken: _rt, passwordResetToken, passwordResetExpires, ...safeUser } = user;

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: safeUser };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent: don't reveal if email exists

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: expires },
  });

  // TODO: send email with token
  console.log(`Password reset token for ${email}: ${token}`);
}

export async function resetPassword(token: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, refreshToken: null },
  });
}
