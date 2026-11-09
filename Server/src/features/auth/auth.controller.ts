import 'dotenv/config';
import { Request, response, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from './auth.service';
import prisma from '../../config/prisma'

const generateToken = (userId: string, email: string) => {
  const secret = process.env.JWT_SECRET || 'default_secret_key';
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' });
};

export const generateOTP = (length: number = 6): string => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu!' });
    }
    const user = await prisma.users.findUnique({
      where: { email },
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
    return res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được đăng ký trước đó!' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        full_name: name || 'Traveler',
        email,
        password_hash,
        role: 'user',
      },
    });

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({ message: 'Lỗi server nội bộ', error: error.message });
  }
};

const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const result = await authService.loginWithGoogle(token);

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

const forgetPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email khong tim thay!' });
    }

    const otpCode = generateOTP(6);
    const otpHash = await bcrypt.hash(otpCode, 10);
    const secret = process.env.JWT_SECRET || 'default_secret';
    const tempToken = jwt.sign(
      { email, otpHash },
      secret,
      { expiresIn: '5m' }
    );

    await authService.sendOtpEmail(email, otpCode);

    return res.status(200).json({
      message: 'Đã gửi otp đến mail của bạn!',
      tempToken,
    });
  }
  catch (error: any) {
    console.log("CHI TIẾT LỖI SERVICE:", error);
  }
};

const verifyOTP = async (req: any, res: Response) => {
  try {
    const { email, otp, tempToken } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Thiếu thông tin mã xác thực hoặc OTP!' });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    let decoded: any;

    // Kiểm tra token tạm có hợp lệ và hết hạn chưa (5 phút)
    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (err) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không hợp lệ!' });
    }

    const { email: decodedEmail, otpHash } = decoded;
    // Kiểm tra xem email và mã OTP có khớp không
    if (decodedEmail !== email) {
      return res.status(403).json({ message: 'Yêu cầu không hợp lệ!' });
    }

    if (!(await bcrypt.compare(otp.toString(), otpHash))) {
      return res.status(400).json({ message: 'Mã OTP không chính xác!' });
    }

    return res.status(200).json({ message: 'Xác thực OTP thành công!' });

  } catch (error: any) {
    console.log("LỖI VERIFY OTP:", error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const resetPass = async (req: any, res: Response) => {
  try {
    const { email, tempToken, newPassword } = req.body;

    if (!tempToken || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết!' });
    }

    const secret = process.env.JWT_SECRET || 'default_secret';
    let decoded: any;

    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (err) {
      return res.status(400).json({ message: 'Phiên làm việc đã hết hạn. Vui lòng thử lại!' });
    }

    if (decoded.email !== email) {
      return res.status(400).json({ message: 'Thông tin xác thực không khớp!' });
    }

    // Mã hóa mật khẩu mới trước khi lưu vào Prisma
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    return res.status(200).json({
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    });

  } catch (error: any) {
    console.log("CHI TIẾT LỖI RESET PASS:", error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/*
const refreshLogin = async (req: Request, res: Response) => {(

)};
*/

/*
const logOut = async (req: Request, res: Response) => {(

)};
*/

export default {
  login,
  register,
  googleLogin,
  forgetPass,
  //refreshLogin,
  //logOut,
  verifyOTP,
  resetPass
};