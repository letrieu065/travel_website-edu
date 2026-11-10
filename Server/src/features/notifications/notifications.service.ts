import nodemailer from 'nodemailer';

/* ============================== TYPES ============================== */

export interface NotificationItem {
    id: string;
    user_id: string;
    type: 'booking' | 'payment' | 'reminder' | 'promotion' | 'system';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
}

// TODO: Thêm bảng notifications vào schema.prisma để lưu vào PostgreSQL
const notificationStore: NotificationItem[] = [];

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
    return notificationStore
        .filter((n) => n.user_id === userId || n.user_id === 'all')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const createNotification = async (
    userId: string,
    type: NotificationItem['type'],
    title: string,
    message: string
) => {
    const item: NotificationItem = {
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        user_id: userId,
        type,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
    };
    notificationStore.push(item);
    return item;
};

const markAsRead = async (userId: string, notificationId: string) => {
    const item = notificationStore.find(
        (n) => n.id === notificationId && (n.user_id === userId || n.user_id === 'all')
    );
    if (!item) return null;
    item.is_read = true;
    return item;
};

const markAllAsRead = async (userId: string) => {
    let count = 0;
    notificationStore.forEach((n) => {
        if ((n.user_id === userId || n.user_id === 'all') && !n.is_read) {
            n.is_read = true;
            count += 1;
        }
    });
    return { updated_count: count };
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

