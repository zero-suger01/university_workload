import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './course-objectives.controller';

const router = Router();
router.use(authenticate);

router.get('/by-course/:courseId', ctrl.getByCourse);
router.put('/by-course/:courseId', authorize(Role.ADMIN), ctrl.upsertForCourse);

export default router;
