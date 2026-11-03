import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import nodemailer from 'nodemailer';
import prisma from '../../config/prisma'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID as string);

const generateSystemToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

const loginWithGoogle = async (accessToken: string) => {
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
        googleId: googleId 
      } 
    });
  } else if (!user.google_id) {
    user = await prisma.users.update({
      where: { email: email },
      data: { googleId: googleId }
    });
  }

  const systemToken = generateSystemToken(user);
  return { user, token: systemToken };
};


const loginWithFacebook = async (fbAccessToken: string) => {
    try {
        const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${fbAccessToken}`;
        
        const response = await axios.get(url);
        const { id: facebookId, email, name: full_name, picture } = response.data;
        const avatar_url = picture?.data?.url;

        // Kiểm tra xem user đã tồn tại trong Database (Prisma) chưa
        let user = await prisma.users.findUnique({
            where: { email: email }
        });

        if (!user) {
            user = await prisma.users.create({
                data: {
                    email: email,
                    full_name: full_name,
                    facebookId: facebookId,
                    role: 'user'
                }
            });
        }

        // Tạo Token hệ thống trả về cho Frontend
        const token = generateSystemToken(user.id);
        return { user, token };

    } catch (error: any) {
        throw new Error('Lỗi xác thực với Facebook: ' + error.message);
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const sendOtpEmail = async (toEmail: string, otpCode: string) => {
    await transporter.sendMail({
        from: '"Travel Website Support" <no-reply@travelweb.com>',
        to: toEmail,
        subject: 'Mã xác nhận khôi phục mật khẩu',
        html: `<h3>Mã OTP của bạn là: <b style="color:red;">${otpCode}</b></h3><p>Mã này có hiệu lực trong vòng 5 phút.</p>`
    });
};

export default { 
  loginWithGoogle, 
  loginWithFacebook,
  sendOtpEmail
};