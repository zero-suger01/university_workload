import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { departmentSchema, updateDepartmentSchema } from './departments.schema';
import * as ctrl from './departments.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize(Role.ADMIN), validate(departmentSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN), validate(updateDepartmentSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
