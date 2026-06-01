import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import {
  loginController,
  logoutController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
} from './auth.controller';
import { CONSTANTS } from '../../config/constants';

const router = Router();

const authLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
  max: CONSTANTS.RATE_LIMIT_MAX_AUTH,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/login', authLimiter, validate(loginSchema), loginController);
router.post('/refresh', refreshController);
router.post('/logout', authenticate, logoutController);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

export default router;
