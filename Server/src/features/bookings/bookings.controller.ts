/**
 * ============================================================================
 * MODULE BOOKINGS - CONTROLLER (Xử lý HTTP Request cho Đặt chỗ)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực dữ liệu đầu vào cho quy trình đặt chỗ dịch vụ (Tours, Hotels, Flights).
 * - Xác thực người dùng qua JWT Authorization Bearer Token.
 * - Điều phối dữ liệu xuống Service Layer và trả về HTTP Response chuẩn RESTful.
 * ============================================================================
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bookingsService from './bookings.service';
import env from '../../config/env';

/**
 * Xử lý và chuẩn hóa lỗi cho các phương thức trong Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = error?.message || defaultMessage;
    // Phân loại mã lỗi HTTP phù hợp
    if (msg.includes('Không tìm thấy')) {
        return res.status(404).json({ status: 'error', message: msg });
    }
    if (msg.includes('đã được hủy') || msg.includes('hợp lệ') || msg.includes('phải') || msg.includes('không được')) {
        return res.status(400).json({ status: 'error', message: msg });
    }
    if (msg.includes('không đủ') || msg.includes('hết chỗ') || msg.includes('không còn')) {
        return res.status(409).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
};

/**
 * Kiểm tra chuỗi UUID hợp lệ
 * // (Đã thêm)
 */
const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Lấy giá trị tham số URL an toàn dạng string
 * // (Đã thêm)
 */
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/**
 * Trích xuất User ID từ JWT Header hoặc Request Context
 * // (Đã thêm)
 */
const extractUserId = (req: Request): string => {
    const reqUser = (req as any).user;
    if (reqUser?.id) return reqUser.id;
    if (reqUser?.userId) return reqUser.userId;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = env.JWT_SECRET;
            const decoded: any = jwt.verify(token, secret);
            return decoded.id || decoded.userId || '';
        } catch {
            return '';
        }
    }

    return '';
};

/* ============================== CONTROLLERS ============================== */

/**
 * Tạo mới đơn đặt chỗ dịch vụ đa thể loại (Tour, Khách sạn, Chuyến bay hoặc Combo)
 * - Endpoint: POST /api/v1/bookings
 * - Yêu cầu xác thực: Bearer Token
 * - Body: { items: BookingItemInput[], payment_method?: string, discount_amount?: number }
 * // (Đã thêm)
 */
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

        // Validate chi tiết từng dịch vụ trong danh sách
        for (const item of items) {
            if (!item || !['tour', 'hotel', 'flight'].includes(item.item_type)) {
                return res.status(400).json({
                    status: 'error',
                    message: `Loại dịch vụ không hợp lệ: ${item?.item_type || 'undefined'}. Hỗ trợ: tour, hotel, flight`,
                });
            }

            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Số lượng đặt phải là số nguyên dương lớn hơn 0',
                });
            }

            if (item.item_type === 'hotel') {
                if (!item.check_in || !item.check_out) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Vui lòng chọn ngày nhận phòng (check-in) và ngày trả phòng (check-out)',
                    });
                }
                const checkInDate = new Date(item.check_in);
                const checkOutDate = new Date(item.check_out);
                if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Ngày nhận phòng hoặc ngày trả phòng không hợp lệ',
                    });
                }
                if (checkOutDate.getTime() <= checkInDate.getTime()) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'Ngày trả phòng (check-out) phải sau ngày nhận phòng (check-in)',
                    });
                }
            }
        }

        if (discount_amount !== undefined) {
            const discountNum = Number(discount_amount);
            if (isNaN(discountNum) || discountNum < 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Số tiền giảm giá không hợp lệ (không được là số âm)',
                });
            }
        }

        const booking = await bookingsService.createBooking({
            user_id: userId,
            items,
            payment_method,
            discount_amount,
        });

        return res.status(201).json({ status: 'success', message: 'Đặt chỗ thành công', booking });
    } catch (error: any) {
        return handleControllerError(res, error, 'Lỗi khi tạo đơn đặt chỗ');
    }
};

/**
 * Lấy danh sách lịch sử các đơn đặt chỗ của người dùng hiện tại có phân trang
 * - Endpoint: GET /api/v1/bookings/my-bookings?page=1&limit=10
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
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

/**
 * Lấy chi tiết đơn đặt chỗ bao gồm danh sách dịch vụ và trạng thái giao dịch thanh toán
 * - Endpoint: GET /api/v1/bookings/:id
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
const getBookingById = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ (ID không hợp lệ)' });
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

/**
 * Hủy đơn đặt chỗ và tự động hoàn trả số lượng ghế / phòng khả dụng về kho
 * - Endpoint: PATCH /api/v1/bookings/:id/cancel
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
const cancelBooking = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ (ID không hợp lệ)' });
        }
        const result = await bookingsService.cancelBooking(userId, id);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error: any) {
        return handleControllerError(res, error, 'Lỗi khi hủy đơn đặt chỗ');
    }
};

export default {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};
