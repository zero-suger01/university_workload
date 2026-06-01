import { Request, Response, NextFunction } from 'express';
import * as svc from './staff-units.service';
import { sendSuccess } from '../../utils/ApiResponse';

export async function getBySemester(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getBySemester(req.query['semesterId'] as string));
  } catch (e) { next(e); }
}

export async function recalculate(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.recalculate(req.body.semesterId), 'Staff units recalculated');
  } catch (e) { next(e); }
}
