import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import userService from './user.service';

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

// header: Authorization Bearer | query: user_id
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

// body: UpdateProfileData
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

// body: { old_password, new_password }
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

// header: Authorization Bearer
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

// params: bookingId
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

// header: Authorization Bearer
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

// body: { item_type, item_id }
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

// params: itemType, itemId
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

