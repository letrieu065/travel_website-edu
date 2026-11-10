import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import notificationsService from './notifications.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

// (Đã thêm)
const extractUserId = (req: Request): string => {
    const reqUser = (req as any).user;
    if (reqUser?.userId) return reqUser.userId;
    if (reqUser?.id) return reqUser.id;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'default_secret_key';
            const decoded: any = jwt.verify(token, secret);
            return decoded.userId || decoded.id || '';
        } catch {
            return '';
        }
    }

    return (req.query.user_id as string) || (req.body?.user_id as string) || '';
};

/* ============================== CONTROLLERS ============================== */

const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const notifications = await notificationsService.getMyNotifications(userId);
        return res.status(200).json({ status: 'success', notifications });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách thông báo');
    }
};

// params: id
const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const item = await notificationsService.markAsRead(userId, id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông báo' });
        }
        return res.status(200).json({ status: 'success', notification: item });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đánh dấu đã đọc');
    }
};

const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const result = await notificationsService.markAllAsRead(userId);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đánh dấu đọc tất cả thông báo');
    }
};

// body: { to, subject, html }
const sendEmail = async (req: Request, res: Response) => {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp to, subject và html' });
        }
        const result = await notificationsService.sendEmailNotification({ to, subject, html });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi email thông báo');
    }
};

const getContactChannels = async (req: Request, res: Response) => {
    try {
        const channels = await notificationsService.getContactChannels();
        return res.status(200).json({ status: 'success', channels });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin kênh liên hệ');
    }
};

export default {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    sendEmail,
    getContactChannels,
};

