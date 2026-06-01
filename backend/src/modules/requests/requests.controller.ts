import { Request, Response, NextFunction } from 'express';
import * as svc from './requests.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { requests, meta } = await svc.getAll(req.user!, req.query as Record<string, unknown>);
    sendSuccess(res, requests, 'Requests retrieved', 200, meta);
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(req.params['id'] as string, req.user!)); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await svc.create(req.body, req.user!.userId);
    sendCreated(res, request, 'Request submitted successfully');
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(req.params['id'] as string, req.user!);
    sendNoContent(res);
  } catch (e) { next(e); }
}

export async function bulkRemove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.bulkRemove(req.body.ids as string[], req.user!);
    sendNoContent(res);
  } catch (e) { next(e); }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await svc.approve(req.params['id'] as string, req.body.reviewNotes, req.user!.userId);
    sendSuccess(res, request, 'Request approved');
  } catch (e) { next(e); }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await svc.reject(req.params['id'] as string, req.body.reviewNotes, req.user!.userId);
    sendSuccess(res, request, 'Request rejected');
  } catch (e) { next(e); }
}
