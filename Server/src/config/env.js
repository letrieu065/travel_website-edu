"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Nạp biến môi trường từ .env hiện tại hoặc Server/.env
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
}
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
    console.error('❌ Lỗi bảo mật: JWT_SECRET bị thiếu hoặc có độ dài nhỏ hơn 32 ký tự.');
    process.exit(1);
}
exports.env = {
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
exports.default = exports.env;
//# sourceMappingURL=env.js.map