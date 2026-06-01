import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { roomSchema, updateRoomSchema } from './rooms.schema';
import * as ctrl from './rooms.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize(Role.ADMIN), validate(roomSchema), ctrl.create);
router.put('/:id', authorize(Role.ADMIN), validate(updateRoomSchema), ctrl.update);
router.delete('/:id', authorize(Role.ADMIN), ctrl.remove);

export default router;
