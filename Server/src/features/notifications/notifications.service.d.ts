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
declare const getMyNotifications: (userId: string) => Promise<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: Date | null;
}[]>;
declare const createNotification: (userId: string, type: NotificationItem['type'], title: string, message: string) => Promise<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: Date | null;
}>;
declare const markAsRead: (userId: string, notificationId: string) => Promise<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: Date | null;
} | null>;
declare const markAllAsRead: (userId: string) => Promise<{
    updated_count: number;
}>;
declare const sendEmailNotification: (input: SendEmailInput) => Promise<{
    sent: boolean;
    message: string;
    to?: undefined;
} | {
    message?: undefined;
    sent: boolean;
    to: string;
}>;
declare const getContactChannels: () => Promise<{
    company_name: string;
    zalo_url: string;
    fanpage_url: string;
    messenger_url: string;
    hotline: string;
    email: string;
    headquarters: {
        address: string;
        lat: number;
        lng: number;
        google_maps_url: string;
    };
}>;
declare const _default: {
    getMyNotifications: typeof getMyNotifications;
    createNotification: typeof createNotification;
    markAsRead: typeof markAsRead;
    markAllAsRead: typeof markAllAsRead;
    sendEmailNotification: typeof sendEmailNotification;
    getContactChannels: typeof getContactChannels;
};
export default _default;
