import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { ApiError } from '../utils/ApiError';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  departmentId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // 1. Cookie'dan o'qishga harakat (httpOnly accessToken cookie)
  const cookieToken = req.cookies?.accessToken as string | undefined;

  // 2. Authorization header'dan o'qish (Bearer <token>)
  const authHeader = req.headers.authorization;
  const headerToken =
    authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  // Cookie ustuvor, agar yo'q bo'lsa header ishlatiladi
  const token = cookieToken || headerToken;

  if (!token) {
    return next(ApiError.unauthorized('No token provided'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
