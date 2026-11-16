"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("./auth.controller"));
const router = express_1.default.Router();
router.post('/google', auth_controller_1.default.googleLogin);
router.post('/login', auth_controller_1.default.login);
// Đăng ký tài khoản (hỗ trợ cả send-register-otp và verify-register-otp)
router.post('/register', auth_controller_1.default.register);
router.post('/send-register-otp', auth_controller_1.default.sendRegisterOTP);
router.post('/verify-register-otp', auth_controller_1.default.verifyRegisterOTP);
// Quên mật khẩu & xác thực OTP
router.post('/forget', auth_controller_1.default.forgetPass);
router.post('/forgot-password', auth_controller_1.default.forgetPass);
router.post('/reset', auth_controller_1.default.resetPass);
router.post('/reset-password', auth_controller_1.default.resetPass);
router.post('/verify-otp', auth_controller_1.default.verifyOTP);
exports.default = router;
//# sourceMappingURL=auth.route.js.map