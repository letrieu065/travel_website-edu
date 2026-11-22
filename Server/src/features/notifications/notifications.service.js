"use strict";
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
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const CONTACT_CHANNELS = {
    company_name: 'Natura Travel Vietnam',
    zalo_url: 'https://zalo.me/0900000000',
    fanpage_url: 'https://facebook.com/naturatravel',
    messenger_url: 'https://m.me/naturatravel',
    hotline: '1900 1234',
    email: 'support@naturatravel.com',
    headquarters: {
        address: 'Số 97 Man Thiện, Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
        lat: 10.8482,
        lng: 106.7867,
        google_maps_url: 'https://maps.google.com/?q=10.8482,106.7867',
    },
};
/* ============================== SERVICE METHODS ============================== */
const getMyNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.notifications.findMany({
        where: {
            OR: [{ user_id: userId }, { user_id: 'all' }],
        },
        orderBy: { created_at: 'desc' },
    });
});
const createNotification = (userId, type, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.notifications.create({
        data: {
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
        },
    });
});
const markAsRead = (userId, notificationId) => __awaiter(void 0, void 0, void 0, function* () {
    const item = yield prisma_1.default.notifications.findFirst({
        where: {
            id: notificationId,
            OR: [{ user_id: userId }, { user_id: 'all' }],
        },
    });
    if (!item)
        return null;
    return prisma_1.default.notifications.update({
        where: { id: notificationId },
        data: { is_read: true },
    });
});
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield prisma_1.default.notifications.updateMany({
        where: {
            OR: [{ user_id: userId }, { user_id: 'all' }],
            is_read: false,
        },
        data: { is_read: true },
    });
    return { updated_count: res.count };
});
const sendEmailNotification = (input) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return {
            sent: false,
            message: 'Chưa cấu hình MY_GMAIL / GMAIL_APP_PASSWORD trong môi trường',
        };
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
    yield transporter.sendMail({
        from: '"Natura Travel Support" <no-reply@naturatravel.com>',
        to: input.to,
        subject: input.subject,
        html: input.html,
    });
    return { sent: true, to: input.to };
});
const getContactChannels = () => __awaiter(void 0, void 0, void 0, function* () {
    return CONTACT_CHANNELS;
});
exports.default = {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    sendEmailNotification,
    getContactChannels,
};
//# sourceMappingURL=notifications.service.js.map