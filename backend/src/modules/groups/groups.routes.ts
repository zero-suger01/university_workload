import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './groups.controller';

const router = Router();
router.use(authenticate);

router.get('/by-planning/:planningRowId', ctrl.listByPlanningRow);
router.get('/:id', ctrl.getOne);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.create);
router.post('/bulk', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.bulkCreate);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
