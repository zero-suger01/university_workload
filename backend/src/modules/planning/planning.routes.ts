import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { planningRowSchema, updatePlanningRowSchema } from './planning.schema';
import * as ctrl from './planning.controller';

const router = Router();
router.use(authenticate);

router.get('/summary', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.summary);
router.get('/', ctrl.list);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(planningRowSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(updatePlanningRowSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
