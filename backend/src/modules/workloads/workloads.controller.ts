import { Request, Response, NextFunction } from 'express';
import * as svc from './workloads.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { workloads, meta } = await svc.getAll(req.user!, req.query as Record<string, unknown>);
    sendSuccess(res, workloads, 'Workloads retrieved', 200, meta);
  } catch (e) { next(e); }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getSummary(req.user!, req.query as Record<string, unknown>);
    sendSuccess(res, data, 'Workload summary retrieved');
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getById(req.params['id'] as string, req.user!)); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await svc.create(req.body, req.user!.userId);
    sendCreated(res, record, 'Workload assigned successfully');
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await svc.update(req.params['id'] as string, req.body, req.user!);
    sendSuccess(res, record, 'Workload updated');
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await svc.remove(req.params['id'] as string, req.user!); sendNoContent(res); } catch (e) { next(e); }
}

/** GET /workloads/group-codes — returns all unique group codes from StudentCohorts */
export async function groupCodes(req: Request, res: Response, next: NextFunction) {
  try {
    const codes = await svc.getAvailableGroupCodes();
    sendSuccess(res, codes, 'Group codes retrieved');
  } catch (e) { next(e); }
}

/** GET /workloads/group-code-conflicts?semesterId=&codes=FM1,FM2&excludeId= */
export async function groupCodeConflicts(req: Request, res: Response, next: NextFunction) {
  try {
    const semesterId = req.query['semesterId'] as string;
    const codesParam = req.query['codes'] as string | undefined;
    const excludeId = req.query['excludeId'] as string | undefined;
    if (!semesterId) { return next(ApiError.badRequest('semesterId is required')); }
    const codes = codesParam ? codesParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
    const conflicts = await svc.getGroupCodeConflicts(semesterId, codes, excludeId);
    sendSuccess(res, conflicts, 'Conflicts checked');
  } catch (e) { next(e); }
}

/** GET /workloads/course-assignments?courseId=&semesterId= */
export async function courseAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = req.query['courseId'] as string;
    const semesterId = req.query['semesterId'] as string;
    if (!courseId || !semesterId) {
      return next(ApiError.badRequest('courseId and semesterId are required'));
    }
    const data = await svc.getCourseAssignments(courseId, semesterId);
    sendSuccess(res, data, 'Course assignments retrieved');
  } catch (e) { next(e); }
}

/** PATCH /workloads/:id/approve */
export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await svc.approveWorkload(req.params['id'] as string, req.user!.userId);
    sendSuccess(res, record, 'Workload accepted');
  } catch (e) { next(e); }
}

/** PATCH /workloads/:id/reject */
export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return next(ApiError.badRequest('A reason of at least 3 characters is required'));
    }
    const record = await svc.rejectWorkload(req.params['id'] as string, req.user!.userId, reason.trim());
    sendSuccess(res, record, 'Workload rejected');
  } catch (e) { next(e); }
}
