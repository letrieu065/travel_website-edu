/**
 * ============================================================================
 * MODULE USERS - CONTROLLER (Xử lý HTTP Request cho Hồ Sơ & Hành Trình Cá Nhân)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực thông tin tài khoản người dùng (Profile, Password).
 * - Cung cấp danh sách hành trình sắp diễn ra và lịch sử chuyến đi của người dùng.
 * - Quản lý danh sách các điểm đến / tour yêu thích (Favorites).
 * ============================================================================
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userService from './user.service';
import env from '../../config/env';

/**
 * Xử lý lỗi chuẩn cho Users Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = error?.message || defaultMessage;
    if (msg.includes('Mật khẩu hiện tại không chính xác') || msg.includes('không chính xác') || msg.includes('không hợp lệ')) {
        return res.status(400).json({ status: 'error', message: msg });
    }
    if (msg.includes('Không tìm thấy') || error?.code === 'P2025' || error?.code === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
};

/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/**
 * Trích xuất User ID từ Authorization Bearer Token
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
 * Lấy thông tin hồ sơ chi tiết của người dùng hiện tại
 * - Endpoint: GET /api/v1/users/profile
 * // (Đã thêm)
 */
const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const user = await userService.getProfile(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
        }
        return res.status(200).json({ status: 'success', user });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin cá nhân');
    }
};

/**
 * Cập nhật thông tin hồ sơ người dùng (họ tên, số điện thoại, avatar)
 * - Endpoint: PUT /api/v1/users/profile
 * - Body: { full_name?: string, phone_number?: string, avatar_url?: string }
 * // (Đã thêm)
 */
const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const updated = await userService.updateProfile(userId, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật hồ sơ thành công', user: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật hồ sơ');
    }
};

/**
 * Đổi mật khẩu tài khoản người dùng
 * - Endpoint: PATCH /api/v1/users/change-password
 * - Body: { old_password, new_password }
 * // (Đã thêm)
 */
const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
        }
        const result = await userService.changePassword(userId, { old_password, new_password });
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đổi mật khẩu');
    }
};

/**
 * Lấy danh sách các chuyến đi sắp tới và lịch sử hành trình cũ của người dùng
 * - Endpoint: GET /api/v1/users/itinerary
 * // (Đã thêm)
 */
const getMyItinerary = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const data = await userService.getMyItinerary(userId);
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy hành trình cá nhân');
    }
};

/**
 * Lấy chi tiết lịch trình một chuyến đi theo mã đặt chỗ (bookingId)
 * - Endpoint: GET /api/v1/users/itinerary/:bookingId
 * // (Đã thêm)
 */
const getItineraryDetail = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const bookingId = getParam(req.params.bookingId);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const detail = await userService.getItineraryDetail(userId, bookingId);
        if (!detail) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chi tiết hành trình' });
        }
        return res.status(200).json({ status: 'success', data: detail });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết hành trình');
    }
};

/**
 * Lấy danh sách dịch vụ và điểm đến yêu thích của người dùng
 * - Endpoint: GET /api/v1/users/favorites
 * // (Đã thêm)
 */
const getFavorites = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const favorites = await userService.getFavorites(userId);
        return res.status(200).json({ status: 'success', data: favorites });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách yêu thích');
    }
};

/**
 * Thêm một mục vào danh sách yêu thích
 * - Endpoint: POST /api/v1/users/favorites
 * - Body: { item_type: 'tour' | 'hotel' | 'flight', item_id: string }
 * // (Đã thêm)
 */
const addFavorite = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const { item_type, item_id } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        if (!item_type || !item_id) {
            return res.status(400).json({ status: 'error', message: 'Thiếu item_type hoặc item_id' });
        }
        const favorites = await userService.addFavorite(userId, { item_type, item_id });
        return res.status(201).json({ status: 'success', message: 'Đã thêm vào yêu thích', data: favorites });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm yêu thích');
    }
};

/**
 * Xóa một mục khỏi danh sách yêu thích
 * - Endpoint: DELETE /api/v1/users/favorites/:itemType/:itemId
 * // (Đã thêm)
 */
const removeFavorite = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const favorites = await userService.removeFavorite(userId, itemType, itemId);
        return res.status(200).json({ status: 'success', message: 'Đã bỏ khỏi yêu thích', data: favorites });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa yêu thích');
    }
};

export default {
    getProfile,
    updateProfile,
    changePassword,
    getMyItinerary,
    getItineraryDetail,
    getFavorites,
    addFavorite,
    removeFavorite,
};
