import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { generateReportSchema } from './reports.schema';
import * as ctrl from './reports.controller';

const router = Router();
router.use(authenticate);
router.use(authorize(Role.ADMIN, Role.DEPARTMENT_HEAD));

router.post('/generate', validate(generateReportSchema), ctrl.generate);
router.get('/', ctrl.list);
router.get('/:id/download', ctrl.download);
router.delete('/:id', ctrl.remove);

export default router;
