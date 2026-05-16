import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { OAuthController } from './oauth.controller.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// OAuth — strategies activate at startup only if env credentials are present.
router.get('/providers', OAuthController.providersStatus);
router.get('/google', OAuthController.googleStart);
router.get('/google/callback', OAuthController.googleCallback);
router.get('/facebook', OAuthController.facebookStart);
router.get('/facebook/callback', OAuthController.facebookCallback);

export default router;
