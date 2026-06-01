import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { semesterSchema, updateSemesterSchema } from './semesters.schema';
import * as ctrl from './semesters.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize(Role.ADMIN), validate(semesterSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN), validate(updateSemesterSchema), ctrl.update);
router.patch('/:id/activate', authorize(Role.ADMIN), ctrl.activate);
router.patch('/:id/deactivate', authorize(Role.ADMIN), ctrl.deactivate);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
