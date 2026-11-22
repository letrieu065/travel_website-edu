"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = __importDefault(require("./auth.controller"));
const router = express_1.default.Router();
// Giới hạn tần suất gửi request để phòng chống Brute-force và ATO
const isTest = process.env.NODE_ENV === 'test';
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 phút
    max: isTest ? 100 : 5, // Tối đa 5 request trong 1 phút
    message: {
        status: 'error',
        message: 'Quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const registerOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 phút
    max: isTest ? 100 : 5,
    message: {
        status: 'error',
        message: 'Quá nhiều yêu cầu gửi mã xác thực đăng ký từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const forgotPassLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 phút
    max: isTest ? 100 : 5,
    message: {
        status: 'error',
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu từ địa chỉ IP này. Vui lòng thử lại sau 1 phút.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/google', auth_controller_1.default.googleLogin);
router.post('/facebook', auth_controller_1.default.facebookLogin);
router.post('/login', loginLimiter, auth_controller_1.default.login);
// Đăng ký tài khoản (hỗ trợ cả send-register-otp và verify-register-otp)
router.post('/register', auth_controller_1.default.register);
router.post('/send-register-otp', registerOtpLimiter, auth_controller_1.default.sendRegisterOTP);
router.post('/verify-register-otp', auth_controller_1.default.verifyRegisterOTP);
// Quên mật khẩu & xác thực OTP
router.post('/forget', forgotPassLimiter, auth_controller_1.default.forgetPass);
router.post('/forgot-password', forgotPassLimiter, auth_controller_1.default.forgetPass);
router.post('/reset', auth_controller_1.default.resetPass);
router.post('/reset-password', auth_controller_1.default.resetPass);
router.post('/verify-otp', auth_controller_1.default.verifyOTP);
exports.default = router;
//# sourceMappingURL=auth.route.js.map