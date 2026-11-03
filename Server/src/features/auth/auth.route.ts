import express from 'express';
import authController from './auth.controller';

const router = express.Router();

router.post('/google', authController.googleLogin);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forget', authController.forgetPass);
router.post('/reset', authController.resetPass);
router.post('/verify-otp', authController.verifyOTP);

export default router;