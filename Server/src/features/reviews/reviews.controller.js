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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const reviews_service_1 = __importDefault(require("./reviews.service"));
const env_1 = __importDefault(require("../../config/env"));
// (Đã thêm)
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};
// (Đã thêm)
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
// (Đã thêm)
const extractUserId = (req) => {
    const reqUser = req.user;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)
        return reqUser.id;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId)
        return reqUser.userId;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = env_1.default.JWT_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded.id || decoded.userId || '';
        }
        catch (_a) {
            return '';
        }
    }
    return '';
};
/* ============================== CONTROLLERS ============================== */
// query: limit, item_type
const getTopReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit) || 6;
        const itemType = req.query.item_type;
        const reviews = yield reviews_service_1.default.getTopReviews(limit, itemType);
        return res.status(200).json({ status: 'success', reviews });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy đánh giá nổi bật');
    }
});
// params: itemType, itemId | query: page, limit, rating
const getReviewsByItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        const { page = 1, limit = 10, rating } = req.query;
        if (!['tour', 'hotel', 'flight'].includes(itemType)) {
            return res.status(400).json({ status: 'error', message: 'itemType phải là tour, hotel hoặc flight' });
        }
        const result = yield reviews_service_1.default.getReviewsByItem(itemType, itemId, {
            page: Number(page),
            limit: Number(limit),
            rating: rating !== undefined ? Number(rating) : undefined,
        });
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đánh giá');
    }
});
// body: { item_id, item_type, rating, comment, media_urls }
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để đánh giá' });
        }
        const { item_id, item_type, rating, comment, media_urls } = req.body;
        if (!item_id || !['tour', 'hotel', 'flight'].includes(item_type) || rating === undefined) {
            return res.status(400).json({ status: 'error', message: 'Thiếu thông tin hoặc item_type/rating không hợp lệ' });
        }
        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ status: 'error', message: 'Điểm đánh giá phải từ 1 đến 5' });
        }
        const review = yield reviews_service_1.default.createReview({
            user_id: userId,
            item_id,
            item_type,
            rating: numRating,
            comment,
            media_urls,
        });
        return res.status(201).json({ status: 'success', message: 'Đã lưu đánh giá thành công', review });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo đánh giá');
    }
});
// params: itemType, itemId
const deleteMyReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        yield reviews_service_1.default.deleteMyReview(userId, itemType, itemId);
        return res.status(200).json({ status: 'success', message: 'Đã xóa đánh giá của bạn' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đánh giá');
    }
});
exports.default = {
    getTopReviews,
    getReviewsByItem,
    createReview,
    deleteMyReview,
};
//# sourceMappingURL=reviews.controller.js.map