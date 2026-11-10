import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import reviewsService, { ReviewItemType } from './reviews.service';

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

// query: limit, item_type
const getTopReviews = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const itemType = req.query.item_type as ReviewItemType | undefined;
        const reviews = await reviewsService.getTopReviews(limit, itemType);
        return res.status(200).json({ status: 'success', reviews });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy đánh giá nổi bật');
    }
};

// params: itemType, itemId | query: page, limit, rating
const getReviewsByItem = async (req: Request, res: Response) => {
    try {
        const itemType = getParam(req.params.itemType) as ReviewItemType;
        const itemId = getParam(req.params.itemId);
        const { page = 1, limit = 10, rating } = req.query;

        if (!['tour', 'hotel', 'flight'].includes(itemType)) {
            return res.status(400).json({ status: 'error', message: 'itemType phải là tour, hotel hoặc flight' });
        }

        const result = await reviewsService.getReviewsByItem(itemType, itemId, {
            page: Number(page),
            limit: Number(limit),
            rating: rating !== undefined ? Number(rating) : undefined,
        });
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đánh giá');
    }
};

// body: { item_id, item_type, rating, comment, media_urls }
const createReview = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để đánh giá' });
        }
        const { item_id, item_type, rating, comment, media_urls } = req.body;
        if (!item_id || !['tour', 'hotel', 'flight'].includes(item_type) || rating === undefined) {
            return res.status(400).json({ status: 'error', message: 'Thiếu thông tin hoặc item_type/rating không hợp lệ' });
        }

        const review = await reviewsService.createReview({
            user_id: userId,
            item_id,
            item_type,
            rating: Number(rating),
            comment,
            media_urls,
        });

        return res.status(201).json({ status: 'success', message: 'Đã lưu đánh giá thành công', review });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo đánh giá');
    }
};

// params: itemType, itemId
const deleteMyReview = async (req: Request, res: Response) => {
    try {
        const userId = extractUserId(req);
        const itemType = getParam(req.params.itemType) as ReviewItemType;
        const itemId = getParam(req.params.itemId);

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }

        await reviewsService.deleteMyReview(userId, itemType, itemId);
        return res.status(200).json({ status: 'success', message: 'Đã xóa đánh giá của bạn' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đánh giá');
    }
};

export default {
    getTopReviews,
    getReviewsByItem,
    createReview,
    deleteMyReview,
};

