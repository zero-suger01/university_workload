import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './dashboard.controller';

const router = Router();
router.use(authenticate);

router.get('/summary', ctrl.summary);
router.get('/workload-distribution', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.workloadDistribution);
router.get('/department-comparison', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.departmentComparison);

export default router;
