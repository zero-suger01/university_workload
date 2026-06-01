// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { importFaculty, importCourses } from './import.service';

export async function importFacultyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await importFaculty(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function importCoursesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await importCourses(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
