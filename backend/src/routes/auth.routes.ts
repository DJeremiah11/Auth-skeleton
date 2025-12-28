import { Router } from 'express';
import passport from '../config/passport';
import { authController } from '../controllers/auth.controller';
import { twoFactorController } from '../controllers/2fa.controller';
import { magicLinkController } from '../controllers/magic-link.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Social Login Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    authController.socialCallback
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
    '/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    authController.socialCallback
);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Session Management
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// 2FA Routes
router.post('/2fa/generate', authenticate, twoFactorController.generate);
router.post('/2fa/verify', authenticate, twoFactorController.verify);
router.post('/2fa/login', twoFactorController.login2FA);

// Magic Link
router.post('/magic-link', magicLinkController.sendLink);
router.get('/verify-magic-link', magicLinkController.verifyLink);

export default router;
