import { Request, Response, NextFunction } from 'express';
import * as svc from './vacancy.service';
import { sendSuccess } from '../../utils/ApiResponse';

export async function getForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const semesterId = req.query['semesterId'] as string;
    const departmentId = req.query['departmentId'] as string | undefined;
    if (!semesterId) {
      res.status(400).json({ success: false, message: 'semesterId is required' });
      return;
    }
    sendSuccess(res, await svc.getForecast(semesterId, departmentId), 'Vacancy forecast calculated');
  } catch (e) { next(e); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getHistory(req.query['semesterId'] as string | undefined));
  } catch (e) { next(e); }
}
