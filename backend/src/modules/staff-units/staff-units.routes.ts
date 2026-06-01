import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './staff-units.controller';

const router = Router();
router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.DEPARTMENT_HEAD));

router.get('/', ctrl.getBySemester);
router.post('/recalculate', authorize(Role.ADMIN), ctrl.recalculate);

export default router;
