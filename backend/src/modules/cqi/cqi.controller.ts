import { Request, Response, NextFunction } from 'express';
import * as svc from './cqi.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const semesterId = req.query['semesterId'] as string | undefined;
    const facultyId = req.query['facultyId'] as string | undefined;
    const status = req.query['status'] as string | undefined;
    sendSuccess(res, await svc.getAll(semesterId, facultyId, status));
  } catch (e) { next(e); }
}

export async function getMy(req: Request, res: Response, next: NextFunction) {
  try {
    const facultyId = req.user!.userId;
    const semesterId = req.query['semesterId'] as string | undefined;
    sendSuccess(res, await svc.getAll(semesterId, facultyId));
  } catch (e) { next(e); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getById(req.params['id'] as string));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const facultyId = req.user!.userId;
    sendCreated(res, await svc.create(facultyId, req.body));
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.update(req.params['id'] as string, req.body));
  } catch (e) { next(e); }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.submit(req.params['id'] as string));
  } catch (e) { next(e); }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = req.body?.notes as string | undefined;
    sendSuccess(res, await svc.approve(req.params['id'] as string, notes));
  } catch (e) { next(e); }
}

export async function requestRevision(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = req.body?.notes as string;
    sendSuccess(res, await svc.requestRevision(req.params['id'] as string, notes));
  } catch (e) { next(e); }
}
