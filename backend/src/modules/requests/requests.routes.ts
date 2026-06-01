import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createRequestSchema, reviewRequestSchema } from './requests.schema';
import * as ctrl from './requests.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize(Role.FACULTY, Role.DEPARTMENT_HEAD), validate(createRequestSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.patch('/:id/approve', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(reviewRequestSchema), ctrl.approve);
router.patch('/:id/reject', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(reviewRequestSchema), ctrl.reject);
router.delete('/bulk', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.bulkRemove);
router.delete('/:id', ctrl.remove);

export default router;
