import { Request, Response, NextFunction } from 'express';
import * as svc from './groups.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function listByPlanningRow(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getByPlanningRow(req.params['planningRowId'] as string));
  } catch (e) { next(e); }
}
export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(req.params['id'] as string)); } catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(req.body)); } catch (e) { next(e); }
}
export async function bulkCreate(req: Request, res: Response, next: NextFunction) {
  try {
    const { planningRowId, programId, groups } = req.body;
    sendCreated(res, await svc.bulkCreate(planningRowId, programId, groups));
  } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.update(req.params['id'] as string, req.body)); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(req.params['id'] as string); sendNoContent(res); } catch (e) { next(e); }
}
