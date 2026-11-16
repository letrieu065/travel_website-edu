import express from 'express';
import authController from './auth.controller';

const router = express.Router();

router.post('/google', authController.googleLogin);
router.post('/login', authController.login);

// Đăng ký tài khoản (hỗ trợ cả send-register-otp và verify-register-otp)
router.post('/register', authController.register);
router.post('/send-register-otp', authController.sendRegisterOTP);
router.post('/verify-register-otp', authController.verifyRegisterOTP);

// Quên mật khẩu & xác thực OTP
router.post('/forget', authController.forgetPass);
router.post('/forgot-password', authController.forgetPass);
router.post('/reset', authController.resetPass);
router.post('/reset-password', authController.resetPass);
router.post('/verify-otp', authController.verifyOTP);

export default router;
