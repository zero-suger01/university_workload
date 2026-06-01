import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './vacancy.controller';

const router = Router();
router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.DEPARTMENT_HEAD));

router.get('/forecast', ctrl.getForecast);
router.get('/history', ctrl.getHistory);

export default router;
