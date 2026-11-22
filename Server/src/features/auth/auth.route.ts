import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from './auth.controller';

const router = express.Router();

// Giới hạn tần suất gửi request để phòng chống Brute-force và ATO
const isTest = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: isTest ? 100 : 5, // Tối đa 5 request trong 1 phút
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: isTest ? 100 : 5,
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu gửi mã xác thực đăng ký từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPassLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: isTest ? 100 : 5,
  message: {
    status: 'error',
    message: 'Quá nhiều yêu cầu đặt lại mật khẩu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/google', authController.googleLogin);
router.post('/facebook', authController.facebookLogin);
router.post('/login', loginLimiter, authController.login);

// Đăng ký tài khoản (hỗ trợ cả send-register-otp và verify-register-otp)
router.post('/register', authController.register);
router.post('/send-register-otp', registerOtpLimiter, authController.sendRegisterOTP);
router.post('/verify-register-otp', authController.verifyRegisterOTP);

// Quên mật khẩu & xác thực OTP
router.post('/forget', forgotPassLimiter, authController.forgetPass);
router.post('/forgot-password', forgotPassLimiter, authController.forgetPass);
router.post('/reset', authController.resetPass);
router.post('/reset-password', authController.resetPass);
router.post('/verify-otp', authController.verifyOTP);

export default router;
