import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { courseSchema, updateCourseSchema } from './courses.schema';
import * as ctrl from './courses.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(courseSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), validate(updateCourseSchema), ctrl.update);
router.patch('/:id/toggle-active', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.toggleActive);
router.delete('/:id', authorize(Role.ADMIN, Role.DEPARTMENT_HEAD), ctrl.remove);

export default router;
