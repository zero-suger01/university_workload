import { Router } from 'express';
import multer from 'multer';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { importFacultyHandler, importCoursesHandler } from './import.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ADMIN only
router.use(authenticate, authorize(Role.ADMIN));

// POST /api/import/faculty  — Excel file with faculty list
router.post('/faculty', upload.single('file'), importFacultyHandler);

// POST /api/import/courses  — Excel file with course catalog
router.post('/courses', upload.single('file'), importCoursesHandler);

export default router;
