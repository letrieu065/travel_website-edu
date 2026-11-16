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
import 'dotenv/config';
import { Request, Response } from 'express';
/**
 * Sinh chuỗi mã OTP ngẫu nhiên gồm các chữ số
 * // (Đã thêm)
 */
export declare const generateOTP: (length?: number) => string;
/**
 * Đăng nhập tài khoản bằng email và mật khẩu
 * - Endpoint: POST /api/v1/auth/login
 * - Body: { email, password }
 * // (Đã thêm)
 */
declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Gửi mã OTP xác thực đăng ký tài khoản qua Gmail
 * - Endpoint: POST /api/v1/auth/send-register-otp
 * - Body: { name, email, password }
 * // (Đã thêm)
 */
declare const sendRegisterOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xác thực mã OTP và hoàn tất tạo tài khoản người dùng mới
 * - Endpoint: POST /api/v1/auth/verify-register-otp
 * - Body: { email, otp, tempToken }
 * // (Đã thêm)
 */
declare const verifyRegisterOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Đăng ký tài khoản (hỗ trợ cả quy trình 2 bước OTP và hoàn tất xác thực)
 * - Endpoint: POST /api/v1/auth/register
 * - Body bước 1: { name, email, password } -> Gửi OTP & trả về tempToken
 * - Body bước 2: { email, otp, tempToken } -> Xác thực OTP & tạo tài khoản
 * // (Đã thêm)
 */
declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Đăng nhập nhanh qua Google OAuth Token
 * - Endpoint: POST /api/v1/auth/google
 * - Body: { token: google_access_token }
 * // (Đã thêm)
 */
declare const googleLogin: (req: Request, res: Response) => Promise<void>;
/**
 * Yêu cầu đặt lại mật khẩu: Sinh mã OTP và gửi qua email
 * - Endpoint: POST /api/v1/auth/forgot-password
 * - Body: { email }
 * // (Đã thêm)
 */
declare const forgetPass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xác thực mã OTP người dùng nhập vào khi quên mật khẩu
 * - Endpoint: POST /api/v1/auth/verify-otp
 * - Body: { email, otp, tempToken }
 * // (Đã thêm)
 */
declare const verifyOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Cập nhật mật khẩu mới sau khi xác thực OTP thành công
 * - Endpoint: POST /api/v1/auth/reset-password
 * - Body: { email, tempToken, newPassword }
 * // (Đã thêm)
 */
declare const resetPass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    login: typeof login;
    register: typeof register;
    sendRegisterOTP: typeof sendRegisterOTP;
    verifyRegisterOTP: typeof verifyRegisterOTP;
    googleLogin: typeof googleLogin;
    forgetPass: typeof forgetPass;
    verifyOTP: typeof verifyOTP;
    resetPass: typeof resetPass;
};
export default _default;
