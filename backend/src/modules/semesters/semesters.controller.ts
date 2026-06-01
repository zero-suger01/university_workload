import { Request, Response, NextFunction } from 'express';
import * as svc from './semesters.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';

export async function list(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getAll()); } catch (e) { next(e); }
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
export async function activate(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.activate(req.params['id'] as string), 'Semester activated'); } catch (e) { next(e); }
}
export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.deactivate(req.params['id'] as string), 'Semester deactivated'); } catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.remove(req.params['id'] as string), 'Semester deleted'); } catch (e) { next(e); }
}
