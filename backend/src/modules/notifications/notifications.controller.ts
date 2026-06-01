import { Request, Response, NextFunction } from 'express';
import * as svc from './notifications.service';
import { sendSuccess } from '../../utils/ApiResponse';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getForUser(req.user!.userId, req.query as Record<string, unknown>);
    sendSuccess(res, { notifications: result.notifications, unreadCount: result.unreadCount }, 'Notifications retrieved', 200, result.meta);
  } catch (e) { next(e); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markRead(req.params['id'] as string, req.user!.userId);
    sendSuccess(res, null, 'Notification marked as read');
  } catch (e) { next(e); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markAllRead(req.user!.userId);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(req.params['id'] as string, req.user!.userId);
    sendSuccess(res, null, 'Notification deleted');
  } catch (e) { next(e); }
}

export async function removeAll(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.removeAll(req.user!.userId);
    sendSuccess(res, null, 'All notifications deleted');
  } catch (e) { next(e); }
}
