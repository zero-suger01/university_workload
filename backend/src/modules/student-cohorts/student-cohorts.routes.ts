import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { cohortSchema, updateCohortSchema } from './student-cohorts.schema';
import * as ctrl from './student-cohorts.controller';

const router = Router();
router.use(authenticate);

router.get('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.getAll);
router.get('/by-program/:programId', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.getByProgram);
router.post('/', authorize(Role.ADMIN), validate(cohortSchema), ctrl.create);
router.put('/:id', authorize(Role.ADMIN), validate(updateCohortSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
