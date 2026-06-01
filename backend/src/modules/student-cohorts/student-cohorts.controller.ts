import { Request, Response, NextFunction } from 'express';
import * as svc from './student-cohorts.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const semesterId = req.query['semesterId'] as string | undefined;
    sendSuccess(res, await svc.getAll(semesterId));
  } catch (e) { next(e); }
}

export async function getByProgram(req: Request, res: Response, next: NextFunction) {
  try {
    const programId = req.params['programId'] as string;
    const semesterId = req.query['semesterId'] as string | undefined;
    sendSuccess(res, await svc.getByProgram(programId, semesterId));
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
