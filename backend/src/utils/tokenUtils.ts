import jwt from 'jsonwebtoken';
import { CONSTANTS } from '../config/constants';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  departmentId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: CONSTANTS.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: TokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: CONSTANTS.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return jwt.verify(token, secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.verify(token, secret) as TokenPayload;
}
