import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bookingsService from './bookings.service';

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

// body: { items, payment_method, discount_amount }
const createBooking = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để đặt dịch vụ' });
        }
        const { items, payment_method, discount_amount } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ít nhất một dịch vụ' });
        }

        const booking = await bookingsService.createBooking({
            user_id: userId,
            items,
            payment_method,
            discount_amount,
        });

        return res.status(201).json({ status: 'success', message: 'Đặt chỗ thành công', booking });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo đơn đặt chỗ');
    }
};

// query: page, limit
const getMyBookings = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await bookingsService.getMyBookings(userId, page, limit);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ');
    }
};

// params: id
const getBookingById = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const booking = await bookingsService.getBookingById(userId, id);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ' });
        }
        return res.status(200).json({ status: 'success', booking });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết đơn đặt chỗ');
    }
};

// params: id
const cancelBooking = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const result = await bookingsService.cancelBooking(userId, id);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi hủy đơn đặt chỗ');
    }
};

export default {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};

