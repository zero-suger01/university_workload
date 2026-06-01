import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';
import * as ctrl from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.list);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(createUserSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.get('/:id/related-counts', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.relatedCounts);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(updateUserSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.remove);

export default router;
