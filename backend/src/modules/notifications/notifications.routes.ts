import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/:id', ctrl.remove);
router.delete('/', ctrl.removeAll);

export default router;
