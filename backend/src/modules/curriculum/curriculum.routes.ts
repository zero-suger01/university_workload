import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { curriculumSchema, updateCurriculumSchema, curriculumItemSchema } from './curriculum.schema';
import * as ctrl from './curriculum.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', authorize(Role.ADMIN), validate(curriculumSchema), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize(Role.ADMIN), validate(updateCurriculumSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);
router.post('/:id/items', authorize(Role.ADMIN), validate(curriculumItemSchema), ctrl.addItem);
router.delete('/:id/items/:itemId', authorize(Role.ADMIN), ctrl.removeItem);

export default router;
