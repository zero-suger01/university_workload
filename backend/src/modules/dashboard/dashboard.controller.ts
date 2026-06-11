import { Request, Response, NextFunction } from 'express';
import * as svc from './dashboard.service';
import { sendSuccess } from '../../utils/ApiResponse';

export async function summary(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getSummary(req.user!, req.query as Record<string, unknown>)); } catch (e) { next(e); }
}
export async function workloadDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getWorkloadDistribution(req.user!, req.query as Record<string, unknown>));
  } catch (e) { next(e); }
}
export async function departmentComparison(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getDepartmentComparison(req.query as Record<string, unknown>));
  } catch (e) { next(e); }
}
