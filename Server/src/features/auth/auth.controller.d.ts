/**
 * ============================================================================
 * MODULE AUTH - CONTROLLER (Xử lý Xác thực & Phân quyền Người Dùng)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Đăng nhập tài khoản truyền thống (Email/Password) và Google OAuth.
 * - Đăng ký tài khoản mới tích hợp gửi mã OTP xác minh qua email.
 * - Quên mật khẩu và đặt lại mật khẩu an toàn với xác thực OTP 2 bước.
 * - Quản lý phiên làm việc tạm thời an toàn trên Server (không lộ secrets / hash).
 * ============================================================================
 */
import 'dotenv/config';
import { Request, Response } from 'express';
/**
 * Sinh chuỗi mã OTP ngẫu nhiên gồm các chữ số an toàn mật mã học (CSPRNG)
 */
export declare const generateOTP: (length?: number) => string;
/**
 * Đăng nhập tài khoản bằng email và mật khẩu
 * - Endpoint: POST /api/v1/auth/login
 * - Body: { email, password }
 */
declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Gửi mã OTP xác thực đăng ký tài khoản qua Gmail
 * - Endpoint: POST /api/v1/auth/send-register-otp
 * - Body: { name, email, password }
 */
declare const sendRegisterOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xác thực mã OTP và hoàn tất tạo tài khoản người dùng mới
 * - Endpoint: POST /api/v1/auth/verify-register-otp
 * - Body: { email, otp, tempToken }
 */
declare const verifyRegisterOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Đăng ký tài khoản (hỗ trợ cả quy trình 2 bước OTP và hoàn tất xác thực)
 * - Endpoint: POST /api/v1/auth/register
 * - Body bước 1: { name, email, password } -> Gửi OTP & trả về tempToken
 * - Body bước 2: { email, otp, tempToken } -> Xác thực OTP & tạo tài khoản
 */
declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Đăng nhập nhanh qua Google OAuth Token
 * - Endpoint: POST /api/v1/auth/google
 * - Body: { token: google_access_token }
 */
declare const googleLogin: (req: Request, res: Response) => Promise<void>;
declare const facebookLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Yêu cầu đặt lại mật khẩu: Sinh mã OTP và gửi qua email
 * - Endpoint: POST /api/v1/auth/forgot-password
 * - Body: { email }
 */
declare const forgetPass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xác thực mã OTP người dùng nhập vào khi quên mật khẩu
 * - Endpoint: POST /api/v1/auth/verify-otp
 * - Body: { email, otp, tempToken }
 */
declare const verifyOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Cập nhật mật khẩu mới sau khi xác thực OTP thành công
 * - Endpoint: POST /api/v1/auth/reset-password
 * - Body: { email, tempToken, resetToken, newPassword }
 */
declare const resetPass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    login: typeof login;
    register: typeof register;
    sendRegisterOTP: typeof sendRegisterOTP;
    verifyRegisterOTP: typeof verifyRegisterOTP;
    googleLogin: typeof googleLogin;
    facebookLogin: typeof facebookLogin;
    forgetPass: typeof forgetPass;
    verifyOTP: typeof verifyOTP;
    resetPass: typeof resetPass;
};
export default _default;
