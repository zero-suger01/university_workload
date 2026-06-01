import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/ApiResponse';

// Detect HTTPS regardless of NODE_ENV — works behind HTTP proxies and bare HTTP deployments
function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

// Cookie options helper
const secureCookieOpts = (req: Request, maxAgeMs: number) => ({
  httpOnly: true,
  secure: isSecureRequest(req),
  sameSite: 'lax' as const,
  maxAge: maxAgeMs,
  path: '/',
});

// Sets all auth cookies after successful login or token refresh
function setAuthCookies(req: Request, res: Response, accessToken: string, refreshToken: string, user: Record<string, unknown>) {
  const secure = isSecureRequest(req);

  // Access token: httpOnly (15 minutes) — JS tarafida o'qilmaydi
  res.cookie('accessToken', accessToken, secureCookieOpts(req, 15 * 60 * 1000));

  // Refresh token: httpOnly (7 days) — faqat /auth/refresh endpointi uchun
  res.cookie('refreshToken', refreshToken, secureCookieOpts(req, 7 * 24 * 60 * 60 * 1000));

  // User profile: NOT httpOnly (7 days) — frontend tezkor render uchun o'qiy oladi
  const profile = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    departmentId: user.departmentId,
    department: user.department,
    employeeId: user.employeeId,
  };
  // Express res.cookie() o'zi encodeURIComponent qiladi — biz raw JSON beramiz
  res.cookie('userProfile', JSON.stringify(profile), {
    httpOnly: false, // frontend JS o'qiy oladi
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);

    setAuthCookies(req, res, accessToken, refreshToken, user as Record<string, unknown>);

    // accessToken ham response'da qaytariladi — frontend memory'ga olishi uchun
    sendSuccess(res, { accessToken, user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, message: 'No refresh token', code: 'UNAUTHORIZED' });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.refresh(token);

    setAuthCookies(req, res, accessToken, refreshToken, user as Record<string, unknown>);

    // user ham qaytariladi — frontend session restore uchun
    sendSuccess(res, { accessToken, user }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.userId) {
      await authService.logout(req.user.userId);
    }
    // Cookie options must match what was used when setting them
    const secure = isSecureRequest(req);
    res.clearCookie('accessToken', { httpOnly: true, secure, sameSite: 'lax', path: '/' });
    res.clearCookie('refreshToken', { httpOnly: true, secure, sameSite: 'lax', path: '/' });
    res.clearCookie('userProfile', { httpOnly: false, secure, sameSite: 'lax', path: '/' });

    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, null, 'If that email is registered, a reset link has been sent');
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
}
