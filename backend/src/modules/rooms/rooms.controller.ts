import { Request, Response, NextFunction } from 'express';
import * as svc from './rooms.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const roomType = req.query['roomType'] as string | undefined;
    const building = req.query['building'] as string | undefined;
    sendSuccess(res, await svc.getAll(roomType, building));
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getById(req.params['id'] as string));
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
