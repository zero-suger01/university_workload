import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createWorkloadSchema, updateWorkloadSchema } from './workloads.schema';
import * as ctrl from './workloads.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/summary', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.summary);
router.get('/group-codes', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.groupCodes);
router.get('/group-code-conflicts', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.groupCodeConflicts);
router.get('/course-assignments', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.courseAssignments);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(createWorkloadSchema), ctrl.create);
router.patch('/:id/approve', authorize(Role.FACULTY), ctrl.approve);
router.patch('/:id/reject', authorize(Role.FACULTY), ctrl.reject);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(updateWorkloadSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.remove);

export default router;
