import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { assignmentSchema, updateAssignmentSchema } from './workload-assignments.schema';
import * as ctrl from './workload-assignments.controller';

const router = Router();
router.use(authenticate);

router.get('/by-planning/:planningRowId', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.getByPlanningRow);
router.get('/by-faculty/:facultyId', ctrl.getByFaculty);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(assignmentSchema), ctrl.create);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(updateAssignmentSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.remove);

export default router;
