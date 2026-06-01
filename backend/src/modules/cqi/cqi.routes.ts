import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { cqiSchema, updateCqiSchema } from './cqi.schema';
import * as ctrl from './cqi.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.getAll);
router.get('/my', authorize(Role.FACULTY), ctrl.getMy);
router.get('/:id', ctrl.getById);
router.post('/', authorize(Role.FACULTY), validate(cqiSchema), ctrl.create);
router.put('/:id', authorize(Role.FACULTY), validate(updateCqiSchema), ctrl.update);
router.post('/:id/submit', authorize(Role.FACULTY), ctrl.submit);
router.post('/:id/approve', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.approve);
router.post('/:id/revision', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.requestRevision);

export default router;
