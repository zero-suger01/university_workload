import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as svc from './reports.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await svc.generate(req.body, req.user!.userId);
    sendCreated(res, report, 'Report generated successfully');
  } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, await svc.getAll(req.user!.userId)); } catch (e) { next(e); }
}

export async function download(req: Request, res: Response, next: NextFunction) {
  try {
    const { prisma } = await import('../../config/database');
    const report = await prisma.report.findUnique({ where: { id: req.params['id'] as string } });
    if (!report?.fileUrl) throw ApiError.notFound('Report file not found');
    const absPath = path.isAbsolute(report.fileUrl) ? report.fileUrl : path.resolve(report.fileUrl);
    if (!fs.existsSync(absPath)) throw ApiError.notFound('File no longer exists on disk');

    res.download(absPath, path.basename(absPath));
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(req.params['id'] as string);
    sendSuccess(res, null, 'Report deleted successfully');
  } catch (e) { next(e); }
}
