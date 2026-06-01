import { Request, Response, NextFunction } from 'express';
import * as svc from './curriculum.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { curricula, meta } = await svc.getAll(req.query as Record<string, unknown>);
    sendSuccess(res, curricula, 'Curricula retrieved', 200, meta);
  } catch (e) { next(e); }
}
export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(req.params['id'] as string)); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(req.body)); } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.update(req.params['id'] as string, req.body)); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(req.params['id'] as string); sendNoContent(res); } catch (e) { next(e); }
}
export async function addItem(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.addItem(req.body)); } catch (e) { next(e); }
}
export async function removeItem(req: Request, res: Response, next: NextFunction) {
  try { await svc.removeItem(req.params['itemId'] as string); sendNoContent(res); } catch (e) { next(e); }
}
