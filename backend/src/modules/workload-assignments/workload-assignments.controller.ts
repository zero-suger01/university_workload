import { Request, Response, NextFunction } from 'express';
import * as svc from './workload-assignments.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function getByPlanningRow(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getByPlanningRow(req.params['planningRowId'] as string));
  } catch (e) { next(e); }
}

export async function getByFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const facultyId = req.params['facultyId'] as string;
    const semesterId = req.query['semesterId'] as string | undefined;
    sendSuccess(res, await svc.getByFaculty(facultyId, semesterId));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { sendCreated(res, await svc.create(req.body)); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.update(req.params['id'] as string, req.body));
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(req.params['id'] as string); sendNoContent(res); } catch (e) { next(e); }
}
