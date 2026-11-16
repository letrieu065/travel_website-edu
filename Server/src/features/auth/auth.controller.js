"use strict";
/**
 * ============================================================================
 * MODULE AUTH - CONTROLLER (Xử lý Đăng nhập, Đăng ký, OAuth & Quên mật khẩu)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Xác thực thông tin đăng nhập truyền thống (Email + Password qua bcrypt).
 * - Tích hợp xác thực Single Sign-On (SSO) Google OAuth 2.0.
 * - Quy trình Đăng ký tài khoản có xác thực OTP qua Gmail (2 bước bảo mật).
 * - Quy trình Quên mật khẩu: Sinh mã OTP 6 số, mã hóa JWT tạm (5 phút), gửi mail qua Nodemailer.
 * - Cấp phát JSON Web Token (JWT) có hạn 7 ngày để truy cập các tài nguyên bảo vệ.
 * ============================================================================
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
require("dotenv/config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = __importDefault(require("./auth.service"));
const prisma_1 = __importDefault(require("../../config/prisma"));
/**
 * Sinh mã JWT Token cho phiên đăng nhập người dùng (thời hạn 7 ngày)
 * // (Đã thêm)
 */
const generateToken = (userId, email) => {
    const secret = process.env.JWT_SECRET || 'default_secret_key';
    return jsonwebtoken_1.default.sign({ userId, email }, secret, { expiresIn: '7d' });
};
/**
 * Sinh chuỗi mã OTP ngẫu nhiên gồm các chữ số
 * // (Đã thêm)
 */
const generateOTP = (length = 6) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
};
exports.generateOTP = generateOTP;
/**
 * Đăng nhập tài khoản bằng email và mật khẩu
 * - Endpoint: POST /api/v1/auth/login
 * - Body: { email, password }
 * // (Đã thêm)
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu!' });
        }
        const user = yield prisma_1.default.users.findUnique({
            where: { email },
        });
        if (!user || !user.password_hash) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }
        const accessToken = generateToken(user.id, user.email);
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error('Lỗi đăng nhập:', error);
        return res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
});
/**
 * Gửi mã OTP xác thực đăng ký tài khoản qua Gmail
 * - Endpoint: POST /api/v1/auth/send-register-otp
 * - Body: { name, email, password }
 * // (Đã thêm)
 */
const sendRegisterOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!' });
        }
        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Địa chỉ email không đúng định dạng!' });
        }
        // Kiểm tra xem email đã tồn tại trong DB chưa
        const existingUser = yield prisma_1.default.users.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản trước đó!' });
        }
        const otpCode = (0, exports.generateOTP)(6);
        const otpHash = yield bcrypt_1.default.hash(otpCode, 10);
        const password_hash = yield bcrypt_1.default.hash(password, 10);
        const secret = process.env.JWT_SECRET || 'default_secret_key';
        const tempToken = jsonwebtoken_1.default.sign({
            name: name || 'Traveler',
            email: email.toLowerCase().trim(),
            password_hash,
            otpHash,
            type: 'register',
        }, secret, { expiresIn: '10m' });
        // Gửi email OTP tới Gmail người dùng
        yield auth_service_1.default.sendRegisterOtpEmail(email.toLowerCase().trim(), otpCode);
        return res.status(200).json({
            status: 'success',
            needOtp: true,
            message: 'Mã xác thực đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.',
            tempToken,
        });
    }
    catch (error) {
        console.error('Lỗi khi gửi OTP đăng ký:', error);
        return res.status(500).json({ message: 'Lỗi server khi gửi mã xác thực', error: error.message });
    }
});
/**
 * Xác thực mã OTP và hoàn tất tạo tài khoản người dùng mới
 * - Endpoint: POST /api/v1/auth/verify-register-otp
 * - Body: { email, otp, tempToken }
 * // (Đã thêm)
 */
const verifyRegisterOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, tempToken } = req.body;
        if (!tempToken || !otp) {
            return res.status(400).json({ message: 'Thiếu mã OTP hoặc mã phiên xác thực!' });
        }
        const secret = process.env.JWT_SECRET || 'default_secret_key';
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, secret);
        }
        catch (_a) {
            return res.status(400).json({ message: 'Mã xác thực hoặc phiên đăng ký đã hết hạn. Vui lòng thử lại!' });
        }
        if (decoded.type !== 'register') {
            return res.status(403).json({ message: 'Mã phiên không hợp lệ cho quy trình đăng ký!' });
        }
        if (decoded.email.toLowerCase() !== email.toLowerCase().trim()) {
            return res.status(403).json({ message: 'Email xác thực không khớp với phiên làm việc!' });
        }
        const isOtpValid = yield bcrypt_1.default.compare(otp.toString().trim(), decoded.otpHash);
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Mã xác thực OTP không chính xác. Vui lòng thử lại!' });
        }
        // Kiểm tra lại lần nữa phòng trường hợp email được tạo trong lúc chờ nhập OTP
        const existingUser = yield prisma_1.default.users.findUnique({
            where: { email: decoded.email },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản!' });
        }
        // Tạo mới tài khoản người dùng sau khi xác thực OTP thành công
        const newUser = yield prisma_1.default.users.create({
            data: {
                full_name: decoded.name || 'Traveler',
                email: decoded.email,
                password_hash: decoded.password_hash,
                role: 'user',
            },
        });
        const accessToken = generateToken(newUser.id, newUser.email);
        return res.status(201).json({
            status: 'success',
            message: 'Xác thực OTP thành công! Đăng ký tài khoản hoàn tất.',
            user: {
                id: newUser.id,
                name: newUser.full_name,
                email: newUser.email,
                role: newUser.role,
            },
            accessToken,
        });
    }
    catch (error) {
        console.error('Lỗi khi xác thực OTP đăng ký:', error);
        return res.status(500).json({ message: 'Lỗi server khi xác thực tài khoản', error: error.message });
    }
});
/**
 * Đăng ký tài khoản (hỗ trợ cả quy trình 2 bước OTP và hoàn tất xác thực)
 * - Endpoint: POST /api/v1/auth/register
 * - Body bước 1: { name, email, password } -> Gửi OTP & trả về tempToken
 * - Body bước 2: { email, otp, tempToken } -> Xác thực OTP & tạo tài khoản
 * // (Đã thêm)
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, tempToken } = req.body;
        // Nếu người dùng đã cung cấp OTP và tempToken -> tiến hành xác thực và tạo tài khoản
        if (otp && tempToken) {
            return verifyRegisterOTP(req, res);
        }
        // Nếu chưa cung cấp OTP -> tiến hành gửi OTP qua Gmail
        return sendRegisterOTP(req, res);
    }
    catch (error) {
        console.error('Lỗi quy trình đăng ký:', error);
        return res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
    }
});
/**
 * Đăng nhập nhanh qua Google OAuth Token
 * - Endpoint: POST /api/v1/auth/google
 * - Body: { token: google_access_token }
 * // (Đã thêm)
 */
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        const result = yield auth_service_1.default.loginWithGoogle(token);
        res.status(200).json({
            message: 'Đăng nhập Google thành công',
            user: result.user,
            accessToken: result.token
        });
    }
    catch (error) {
        console.log("CHI TIẾT LỖI SERVICE:", error);
        res.status(401).json({
            message: 'Xác thực Google thất bại',
            error: error.message
        });
    }
});
/**
 * Yêu cầu đặt lại mật khẩu: Sinh mã OTP và gửi qua email
 * - Endpoint: POST /api/v1/auth/forgot-password
 * - Body: { email }
 * // (Đã thêm)
 */
const forgetPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield prisma_1.default.users.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ message: 'Email không tìm thấy!' });
        }
        const otpCode = (0, exports.generateOTP)(6);
        const otpHash = yield bcrypt_1.default.hash(otpCode, 10);
        const secret = process.env.JWT_SECRET || 'default_secret';
        const tempToken = jsonwebtoken_1.default.sign({ email, otpHash }, secret, { expiresIn: '5m' });
        yield auth_service_1.default.sendOtpEmail(email, otpCode);
        return res.status(200).json({
            message: 'Đã gửi otp đến mail của bạn!',
            tempToken,
        });
    }
    catch (error) {
        console.log("CHI TIẾT LỖI SERVICE:", error);
        return res.status(500).json({ message: 'Lỗi khi gửi email OTP', error: error === null || error === void 0 ? void 0 : error.message });
    }
});
/**
 * Xác thực mã OTP người dùng nhập vào khi quên mật khẩu
 * - Endpoint: POST /api/v1/auth/verify-otp
 * - Body: { email, otp, tempToken }
 * // (Đã thêm)
 */
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp, tempToken } = req.body;
        if (!tempToken || !otp) {
            return res.status(400).json({ message: 'Thiếu thông tin mã xác thực hoặc OTP!' });
        }
        const secret = process.env.JWT_SECRET || 'default_secret';
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, secret);
        }
        catch (_a) {
            return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
        }
        const { email: decodedEmail, otpHash } = decoded;
        if (decodedEmail !== email) {
            return res.status(403).json({ message: 'Yêu cầu không hợp lệ!' });
        }
        if (!(yield bcrypt_1.default.compare(otp.toString(), otpHash))) {
            return res.status(400).json({ message: 'Mã OTP không chính xác!' });
        }
        return res.status(200).json({ message: 'Xác thực OTP thành công!' });
    }
    catch (error) {
        console.log("LỖI VERIFY OTP:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});
/**
 * Cập nhật mật khẩu mới sau khi xác thực OTP thành công
 * - Endpoint: POST /api/v1/auth/reset-password
 * - Body: { email, tempToken, newPassword }
 * // (Đã thêm)
 */
const resetPass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, tempToken, newPassword } = req.body;
        if (!tempToken || !newPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết!' });
        }
        const secret = process.env.JWT_SECRET || 'default_secret';
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, secret);
        }
        catch (_a) {
            return res.status(400).json({ message: 'Phiên làm việc đã hết hạn. Vui lòng thử lại!' });
        }
        if (decoded.email !== email) {
            return res.status(400).json({ message: 'Thông tin xác thực không khớp!' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield prisma_1.default.users.update({
            where: { email },
            data: { password_hash: hashedPassword },
        });
        return res.status(200).json({
            message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
        });
    }
    catch (error) {
        console.log("CHI TIẾT LỖI RESET PASS:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});
exports.default = {
    login,
    register,
    sendRegisterOTP,
    verifyRegisterOTP,
    googleLogin,
    forgetPass,
    verifyOTP,
    resetPass
};
//# sourceMappingURL=auth.controller.js.map