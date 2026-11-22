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
import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from './auth.service';
import prisma from '../../config/prisma';
import env from '../../config/env';

/**
 * Interface cho phiên OTP lưu trữ phía Server
 */
interface RegisterOtpSession {
  sessionId: string;
  email: string;
  name: string;
  password_hash: string;
  otpHash: string;
  failedAttempts: number;
  expiresAt: number; // TTL 5 phút
}

interface ForgotPasswordOtpSession {
  sessionId: string;
  email: string;
  otpHash: string;
  failedAttempts: number;
  expiresAt: number; // TTL 5 phút
}

// Lưu trữ phiên xác thực tạm thời an toàn trên bộ nhớ Server
const registerOtpStore = new Map<string, RegisterOtpSession>();
const forgotPasswordOtpStore = new Map<string, ForgotPasswordOtpSession>();

// Định kỳ dọn dẹp các phiên OTP đã hết hạn mỗi 60 giây
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of registerOtpStore.entries()) {
    if (session.expiresAt <= now) {
      registerOtpStore.delete(key);
    }
  }
  for (const [key, session] of forgotPasswordOtpStore.entries()) {
    if (session.expiresAt <= now) {
      forgotPasswordOtpStore.delete(key);
    }
  }
}, 60 * 1000).unref();

/**
 * Sinh mã JWT Token cho phiên đăng nhập người dùng (thời hạn 7 ngày)
 */
const generateToken = (userId: string, email: string) => {
  return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Sinh chuỗi mã OTP ngẫu nhiên gồm các chữ số an toàn mật mã học (CSPRNG)
 */
export const generateOTP = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

/**
 * Ẩn thông tin lỗi nội bộ trong môi trường production để bảo mật hệ thống
 */
const sanitizeErrorMessage = (error: any, fallbackMessage: string = 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau') => {
  if (process.env.NODE_ENV === 'production') {
    return 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau';
  }
  return error?.message || fallbackMessage;
};

/**
 * Đăng nhập tài khoản bằng email và mật khẩu
 * - Endpoint: POST /api/v1/auth/login
 * - Body: { email, password }
 */
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu!' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

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
  } catch (error: any) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server nội bộ') });
  }
};

/**
 * Gửi mã OTP xác thực đăng ký tài khoản qua Gmail
 * - Endpoint: POST /api/v1/auth/send-register-otp
 * - Body: { name, email, password }
 */
const sendRegisterOTP = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Email không đúng định dạng!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 6 ký tự!' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Kiểm tra xem email đã tồn tại trong DB chưa
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản trước đó!' });
    }

    const otpCode = generateOTP(6);
    const otpHash = await bcrypt.hash(otpCode, 10);
    const password_hash = await bcrypt.hash(password, 10);
    const sessionId = crypto.randomUUID();

    // Lưu trữ an toàn thông tin nhạy cảm ở phía server
    registerOtpStore.set(sessionId, {
      sessionId,
      email: cleanEmail,
      name: typeof name === 'string' && name.trim() ? name.trim() : 'Traveler',
      password_hash,
      otpHash,
      failedAttempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Client token CHỈ chứa định danh phiên và email, TUYỆT ĐỐI không chứa password_hash hoặc otpHash
    const tempToken = jwt.sign(
      {
        sessionId,
        email: cleanEmail,
        type: 'register',
      },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Gửi email OTP tới Gmail người dùng
    await authService.sendRegisterOtpEmail(cleanEmail, otpCode);

    return res.status(200).json({
      status: 'success',
      needOtp: true,
      message: 'Mã xác thực đã được gửi đến email của bạn! Vui lòng kiểm tra hộp thư.',
      tempToken,
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi OTP đăng ký:', error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server khi gửi mã xác thực') });
  }
};

/**
 * Xác thực mã OTP và hoàn tất tạo tài khoản người dùng mới
 * - Endpoint: POST /api/v1/auth/verify-register-otp
 * - Body: { email, otp, tempToken }
 */
const verifyRegisterOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, tempToken } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Thiếu mã OTP hoặc mã phiên xác thực!' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Mã xác thực hoặc phiên đăng ký đã hết hạn. Vui lòng thử lại!' });
    }

    if (decoded.type !== 'register') {
      return res.status(403).json({ message: 'Mã phiên không hợp lệ cho quy trình đăng ký!' });
    }

    if (decoded.email.toLowerCase() !== email?.toLowerCase().trim()) {
      return res.status(403).json({ message: 'Email xác thực không khớp với phiên làm việc!' });
    }

    const sessionId = decoded.sessionId;
    const session = sessionId ? registerOtpStore.get(sessionId) : null;

    if (!session || Date.now() > session.expiresAt) {
      if (sessionId) registerOtpStore.delete(sessionId);
      return res.status(400).json({ message: 'Mã xác thực hoặc phiên đăng ký đã hết hạn. Vui lòng thử lại!' });
    }

    if (session.failedAttempts >= 5) {
      registerOtpStore.delete(sessionId);
      return res.status(400).json({ message: 'Phiên xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới!' });
    }

    const isOtpValid = await bcrypt.compare(otp.toString().trim(), session.otpHash);
    if (!isOtpValid) {
      session.failedAttempts += 1;
      if (session.failedAttempts >= 5) {
        registerOtpStore.delete(sessionId);
        return res.status(400).json({ message: 'Phiên xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới!' });
      }
      return res.status(400).json({ message: `Mã xác thực OTP không chính xác. Bạn còn ${5 - session.failedAttempts} lần thử.` });
    }

    // Xác thực thành công -> Hủy phiên OTP để tránh dùng lại (One-time use)
    registerOtpStore.delete(sessionId);

    // Kiểm tra lại lần nữa phòng trường hợp email được tạo trong lúc chờ nhập OTP
    const existingUser = await prisma.users.findUnique({
      where: { email: session.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được đăng ký tài khoản!' });
    }

    // Tạo mới tài khoản người dùng sau khi xác thực OTP thành công
    const newUser = await prisma.users.create({
      data: {
        full_name: session.name || 'Traveler',
        email: session.email,
        password_hash: session.password_hash,
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
  } catch (error: any) {
    console.error('Lỗi khi xác thực OTP đăng ký:', error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server khi xác thực tài khoản') });
  }
};

/**
 * Đăng ký tài khoản (hỗ trợ cả quy trình 2 bước OTP và hoàn tất xác thực)
 * - Endpoint: POST /api/v1/auth/register
 * - Body bước 1: { name, email, password } -> Gửi OTP & trả về tempToken
 * - Body bước 2: { email, otp, tempToken } -> Xác thực OTP & tạo tài khoản
 */
const register = async (req: Request, res: Response) => {
  try {
    const { otp, tempToken } = req.body;

    if (otp && tempToken) {
      return verifyRegisterOTP(req, res);
    }

    return sendRegisterOTP(req, res);
  } catch (error: any) {
    console.error('Lỗi quy trình đăng ký:', error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server nội bộ') });
  }
};

/**
 * Đăng nhập nhanh qua Google OAuth Token
 * - Endpoint: POST /api/v1/auth/google
 * - Body: { token: google_access_token }
 */
const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, password, confirm_password } = req.body;

    const result = await authService.loginWithGoogle(token, password || confirm_password);

    res.status(200).json({
      message: 'Đăng nhập Google thành công',
      user: result.user,
      accessToken: result.token
    });
  } catch (error: any) {
    console.log("CHI TIẾT LỖI SERVICE:", error);
    res.status(401).json({
      message: 'Xác thực Google thất bại',
      error: error.message
    });
  }
};

const facebookLogin = async (req: Request, res: Response) => {
  try {
    const { token, access_token, password, confirm_password } = req.body;
    const fbToken = token || access_token;
    if (!fbToken) {
      return res.status(400).json({ message: 'Vui lòng cung cấp token Facebook' });
    }

    const result = await authService.loginWithFacebook(fbToken, password || confirm_password);

    res.status(200).json({
      message: 'Đăng nhập Facebook thành công',
      user: result.user,
      accessToken: result.token
    });
  } catch (error: any) {
    res.status(401).json({
      message: 'Xác thực Facebook thất bại',
      error: error.message
    });
  }
};

/**
 * Yêu cầu đặt lại mật khẩu: Sinh mã OTP và gửi qua email
 * - Endpoint: POST /api/v1/auth/forgot-password
 * - Body: { email }
 */
const forgetPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Vui lòng cung cấp email hợp lệ!' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email không tìm thấy!' });
    }

    const otpCode = generateOTP(6);
    const otpHash = await bcrypt.hash(otpCode, 10);
    const sessionId = crypto.randomUUID();

    forgotPasswordOtpStore.set(sessionId, {
      sessionId,
      email: cleanEmail,
      otpHash,
      failedAttempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const tempToken = jwt.sign(
      { sessionId, email: cleanEmail, isVerified: false, purpose: 'forgot_password' },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    await authService.sendOtpEmail(cleanEmail, otpCode);

    return res.status(200).json({
      status: 'success',
      message: 'Đã gửi otp đến mail của bạn!',
      tempToken,
    });
  } catch (error: any) {
    console.log("CHI TIẾT LỖI SERVICE:", error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi khi gửi email OTP') });
  }
};

/**
 * Xác thực mã OTP người dùng nhập vào khi quên mật khẩu
 * - Endpoint: POST /api/v1/auth/verify-otp
 * - Body: { email, otp, tempToken }
 */
const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp, tempToken } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Thiếu thông tin mã xác thực hoặc OTP!' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
    }

    const { email: decodedEmail, sessionId } = decoded;
    if (decodedEmail.toLowerCase() !== email?.toLowerCase().trim()) {
      return res.status(403).json({ message: 'Yêu cầu không hợp lệ!' });
    }

    const session = sessionId ? forgotPasswordOtpStore.get(sessionId) : null;
    if (!session || Date.now() > session.expiresAt) {
      if (sessionId) forgotPasswordOtpStore.delete(sessionId);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
    }

    if (session.failedAttempts >= 5) {
      forgotPasswordOtpStore.delete(sessionId);
      return res.status(400).json({ message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng xin mã mới!' });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), session.otpHash);
    if (!isMatch) {
      session.failedAttempts += 1;
      if (session.failedAttempts >= 5) {
        forgotPasswordOtpStore.delete(sessionId);
        return res.status(400).json({ message: 'Mã OTP đã bị khóa do nhập sai quá 5 lần. Vui lòng xin mã mới!' });
      }
      return res.status(400).json({ message: `Mã OTP không chính xác! Bạn còn ${5 - session.failedAttempts} lần thử.` });
    }

    // Xác thực thành công -> Hủy phiên OTP
    forgotPasswordOtpStore.delete(sessionId);

    // Sinh resetToken có claim isVerified: true để bảo vệ bước reset mật khẩu
    const resetToken = jwt.sign(
      { email: decodedEmail, isVerified: true, purpose: 'reset_password' },
      env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Xác thực OTP thành công!',
      resetToken,
      tempToken: resetToken, // Hỗ trợ cả 2 tên trường để tương thích ngược
    });
  } catch (error: any) {
    console.log("LỖI VERIFY OTP:", error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server') });
  }
};

/**
 * Cập nhật mật khẩu mới sau khi xác thực OTP thành công
 * - Endpoint: POST /api/v1/auth/reset-password
 * - Body: { email, tempToken, resetToken, newPassword }
 */
const resetPass = async (req: Request, res: Response) => {
  try {
    const { email, tempToken, resetToken, newPassword } = req.body;
    const tokenToVerify = resetToken || tempToken;

    if (!tokenToVerify || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết!' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 6 ký tự!' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(tokenToVerify, env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Phiên làm việc đã hết hạn. Vui lòng thử lại!' });
    }

    // BẮT BUỘC kiểm tra xem OTP đã được xác minh thành công hay chưa
    if (!decoded.isVerified || decoded.purpose !== 'reset_password') {
      return res.status(403).json({
        message: 'Mã xác thực OTP chưa được kiểm tra hoặc không hợp lệ cho quy trình đổi mật khẩu!'
      });
    }

    if (decoded.email.toLowerCase() !== email?.toLowerCase().trim()) {
      return res.status(400).json({ message: 'Thông tin xác thực không khớp!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email: decoded.email },
      data: { password_hash: hashedPassword },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    });
  } catch (error: any) {
    console.log("CHI TIẾT LỖI RESET PASS:", error);
    return res.status(500).json({ message: sanitizeErrorMessage(error, 'Lỗi server') });
  }
};

export default {
  login,
  register,
  sendRegisterOTP,
  verifyRegisterOTP,
  googleLogin,
  facebookLogin,
  forgetPass,
  verifyOTP,
  resetPass
};
