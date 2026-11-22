import nodemailer from 'nodemailer';
import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface NotificationItem {
    id: string;
    user_id: string;
    type: 'booking' | 'payment' | 'reminder' | 'promotion' | 'system';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string | Date | null;
}

export interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

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

const getMyNotifications = async (userId: string) => {
    return prisma.notifications.findMany({
        where: {
            OR: [{ user_id: userId }, { user_id: 'all' }],
        },
        orderBy: { created_at: 'desc' },
    });
};

const createNotification = async (
    userId: string,
    type: NotificationItem['type'],
    title: string,
    message: string
) => {
    return prisma.notifications.create({
        data: {
            user_id: userId,
            type,
            title,
            message,
            is_read: false,
        },
    });
};

const markAsRead = async (userId: string, notificationId: string) => {
    const item = await prisma.notifications.findFirst({
        where: {
            id: notificationId,
            OR: [{ user_id: userId }, { user_id: 'all' }],
        },
    });
    if (!item) return null;

    return prisma.notifications.update({
        where: { id: notificationId },
        data: { is_read: true },
    });
};

const markAllAsRead = async (userId: string) => {
    const res = await prisma.notifications.updateMany({
        where: {
            OR: [{ user_id: userId }, { user_id: 'all' }],
            is_read: false,
        },
        data: { is_read: true },
    });
    return { updated_count: res.count };
};

const sendEmailNotification = async (input: SendEmailInput) => {
    if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return {
            sent: false,
            message: 'Chưa cấu hình MY_GMAIL / GMAIL_APP_PASSWORD trong môi trường',
        };
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MY_GMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: '"Natura Travel Support" <no-reply@naturatravel.com>',
        to: input.to,
        subject: input.subject,
        html: input.html,
    });

    return { sent: true, to: input.to };
};

const getContactChannels = async () => {
    return CONTACT_CHANNELS;
};

export default {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    sendEmailNotification,
    getContactChannels,
};

