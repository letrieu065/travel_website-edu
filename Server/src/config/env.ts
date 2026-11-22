import dotenv from 'dotenv';
import path from 'path';

// Nạp biến môi trường từ .env hiện tại hoặc Server/.env
dotenv.config();
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('❌ Lỗi bảo mật: JWT_SECRET bị thiếu hoặc có độ dài nhỏ hơn 32 ký tự.');
  process.exit(1);
}

export const env = {
  JWT_SECRET: jwtSecret,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  PORT: process.env.PORT || '3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  MY_GMAIL: process.env.MY_GMAIL || '',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || '',
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export default env;
