import { Request, Response, NextFunction } from 'express';
import * as svc from './course-objectives.service';
import { sendSuccess } from '../../utils/ApiResponse';

export async function getByCourse(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getByCourse(req.params['courseId'] as string));
  } catch (e) { next(e); }
}

export async function upsertForCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.params['courseId'] as string;
    const objectives = req.body as { number: number; description: string }[];
    sendSuccess(res, await svc.upsertForCourse(courseId, objectives));
  } catch (e) { next(e); }
}
