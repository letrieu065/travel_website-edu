/**
 * ============================================================================
 * MODULE AUTH - SERVICE (Nghiệp vụ Xác thực, OAuth & Gửi Email OTP)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Xác thực OAuth 2.0 với Google và Facebook.
 * - Cấu hình Nodemailer gửi email OTP khôi phục mật khẩu và xác thực đăng ký tài khoản.
 * ============================================================================
 */

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prisma from '../../config/prisma';

// (Đã thêm)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID as string);

// (Đã thêm)
const generateSystemToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// (Đã thêm)
const loginWithGoogle = async (accessToken: string, confirmPassword?: string) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Token Google không hợp lệ hoặc đã hết hạn');
  }
  
  const userInfo = await response.json();
  const { email, name, sub: googleId } = userInfo;

  let user = await prisma.users.findUnique({ 
    where: { email: email } 
  });

  if (!user) {
    user = await prisma.users.create({ 
      data: { 
        full_name: name || 'Người dùng Google', 
        email: email, 
        google_id: googleId,
        auth_provider: 'google'
      } 
    });
  } else if (!user.google_id) {
    // Chặn liên kết tài khoản OAuth không an toàn (Insecure Account Linking)
    // Nếu tài khoản đã tồn tại với email/mật khẩu thông thường (local), phải xác nhận mật khẩu hiện tại
    if (user.auth_provider === 'local' && user.password_hash) {
      if (!confirmPassword) {
        throw new Error('Tài khoản này đã được đăng ký bằng email và mật khẩu cục bộ. Vui lòng xác nhận mật khẩu hiện tại để liên kết tài khoản.');
      }
      const isMatch = await bcrypt.compare(confirmPassword, user.password_hash);
      if (!isMatch) {
        throw new Error('Mật khẩu xác nhận không chính xác để liên kết tài khoản');
      }
    }
    user = await prisma.users.update({
      where: { email: email },
      data: { google_id: googleId }
    });
  }

  const systemToken = generateSystemToken(user);
  return { user, token: systemToken };
};

// (Đã thêm)
const loginWithFacebook = async (fbAccessToken: string, confirmPassword?: string) => {
    try {
        const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${fbAccessToken}`;
        
        const response = await axios.get(url);
        const { id: facebookId, email, name: full_name } = response.data;

        // Kiểm tra xem user đã tồn tại trong Database (Prisma) chưa
        let user = await prisma.users.findUnique({
            where: { email: email }
        });

        if (!user) {
            user = await prisma.users.create({
                data: {
                    email: email,
                    full_name: full_name || 'Người dùng Facebook',
                    facebook_id: facebookId,
                    auth_provider: 'facebook',
                    role: 'user'
                }
            });
        } else if (!user.facebook_id) {
            // Chặn liên kết tài khoản OAuth không an toàn (Insecure Account Linking)
            if (user.auth_provider === 'local' && user.password_hash) {
                if (!confirmPassword) {
                    throw new Error('Tài khoản này đã được đăng ký bằng email và mật khẩu cục bộ. Vui lòng xác nhận mật khẩu hiện tại để liên kết tài khoản.');
                }
                const isMatch = await bcrypt.compare(confirmPassword, user.password_hash);
                if (!isMatch) {
                    throw new Error('Mật khẩu xác nhận không chính xác để liên kết tài khoản');
                }
            }
            user = await prisma.users.update({
                where: { email: email },
                data: { facebook_id: facebookId }
            });
        }

        // Tạo Token hệ thống trả về cho Frontend
        const token = generateSystemToken(user);
        return { user, token };

    } catch (error: any) {
        throw new Error(error.message || 'Lỗi xác thực với Facebook');
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const maskEmail = (email: string): string => {
    return email.replace(/(^.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(b.length, 3)));
};

// (Đã thêm)
const sendOtpEmail = async (toEmail: string, otpCode: string) => {
    console.log("Đã gửi mã xác thực tới email " + maskEmail(toEmail));
    try {
        if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD) {
            return;
        }

        await transporter.sendMail({
            from: '"Natura Travel Support" <no-reply@naturatravel.com>',
            to: toEmail,
            subject: '[Natura Travel] Mã xác nhận khôi phục mật khẩu',
            html: `<h3>Mã OTP của bạn là: <b style="color:red;">${otpCode}</b></h3><p>Mã này có hiệu lực trong vòng 5 phút.</p>`
        });
    } catch (err) {
        console.error('Lỗi khi gửi email OTP khôi phục mật khẩu:', err);
    }
};

// (Đã thêm)
const sendRegisterOtpEmail = async (toEmail: string, otpCode: string) => {
    console.log("Đã gửi mã xác thực tới email " + maskEmail(toEmail));
    try {
        if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD) {
            return;
        }

        await transporter.sendMail({
            from: '"Natura Travel Support" <no-reply@naturatravel.com>',
            to: toEmail,
            subject: '[Natura Travel] Mã xác thực đăng ký tài khoản mới',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #0f141e; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; margin: 0;">NATURA TRAVEL</h2>
                        <span style="font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #b45309;">Xác thực tài khoản mới</span>
                    </div>
                    <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                        Xin chào, <br />
                        Cảm ơn bạn đã đăng ký tài khoản tại <strong>Natura Travel</strong>. Để hoàn tất kích hoạt tài khoản của bạn, vui lòng nhập mã xác thực OTP dưới đây:
                    </p>
                    <div style="text-align: center; margin: 28px 0;">
                        <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0f141e; background-color: #FEF08A; padding: 14px 28px; border-radius: 8px; border: 2px dashed #CA8A04;">
                            ${otpCode}
                        </div>
                    </div>
                    <p style="color: #4b5563; font-size: 13px; line-height: 1.5;">
                        Mã xác thực này có hiệu lực trong vòng <strong>10 phút</strong>. Vì lý do an toàn, vui lòng không chia sẻ mã này cho bất kỳ ai.
                    </p>
                    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                    <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                        Đây là email tự động từ hệ thống Natura Travel. © ${new Date().getFullYear()} Natura Travel Ltd. All rights reserved.
                    </p>
                </div>
            `,
        });
    } catch (err) {
        console.error('Lỗi khi gửi mail OTP đăng ký qua Nodemailer:', err);
    }
};

export default { 
  loginWithGoogle, 
  loginWithFacebook,
  sendOtpEmail,
  sendRegisterOtpEmail,
};
