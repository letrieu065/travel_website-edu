"use strict";
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
const user_service_1 = __importDefault(require("./user.service"));
const env_1 = __importDefault(require("../../config/env"));
/**
 * Xử lý lỗi chuẩn cho Users Controller
 * // (Đã thêm)
 */
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = (error === null || error === void 0 ? void 0 : error.message) || defaultMessage;
    if (msg.includes('Mật khẩu hiện tại không chính xác') || msg.includes('không chính xác') || msg.includes('không hợp lệ')) {
        return res.status(400).json({ status: 'error', message: msg });
    }
    if (msg.includes('Không tìm thấy') || (error === null || error === void 0 ? void 0 : error.code) === 'P2025' || (error === null || error === void 0 ? void 0 : error.code) === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
};
/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/**
 * Trích xuất User ID từ Authorization Bearer Token
 * // (Đã thêm)
 */
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
/**
 * Lấy thông tin hồ sơ chi tiết của người dùng hiện tại
 * - Endpoint: GET /api/v1/users/profile
 * // (Đã thêm)
 */
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const user = yield user_service_1.default.getProfile(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
        }
        return res.status(200).json({ status: 'success', user });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin cá nhân');
    }
});
/**
 * Cập nhật thông tin hồ sơ người dùng (họ tên, số điện thoại, avatar)
 * - Endpoint: PUT /api/v1/users/profile
 * - Body: { full_name?: string, phone_number?: string, avatar_url?: string }
 * // (Đã thêm)
 */
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const updated = yield user_service_1.default.updateProfile(userId, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật hồ sơ thành công', user: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật hồ sơ');
    }
});
/**
 * Đổi mật khẩu tài khoản người dùng
 * - Endpoint: PATCH /api/v1/users/change-password
 * - Body: { old_password, new_password }
 * // (Đã thêm)
 */
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
        }
        const result = yield user_service_1.default.changePassword(userId, { old_password, new_password });
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đổi mật khẩu');
    }
});
/**
 * Lấy danh sách các chuyến đi sắp tới và lịch sử hành trình cũ của người dùng
 * - Endpoint: GET /api/v1/users/itinerary
 * // (Đã thêm)
 */
const getMyItinerary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const data = yield user_service_1.default.getMyItinerary(userId);
        return res.status(200).json({ status: 'success', data });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy hành trình cá nhân');
    }
});
/**
 * Lấy chi tiết lịch trình một chuyến đi theo mã đặt chỗ (bookingId)
 * - Endpoint: GET /api/v1/users/itinerary/:bookingId
 * // (Đã thêm)
 */
const getItineraryDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const bookingId = getParam(req.params.bookingId);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const detail = yield user_service_1.default.getItineraryDetail(userId, bookingId);
        if (!detail) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chi tiết hành trình' });
        }
        return res.status(200).json({ status: 'success', data: detail });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết hành trình');
    }
});
/**
 * Lấy danh sách dịch vụ và điểm đến yêu thích của người dùng
 * - Endpoint: GET /api/v1/users/favorites
 * // (Đã thêm)
 */
const getFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const favorites = yield user_service_1.default.getFavorites(userId);
        return res.status(200).json({ status: 'success', data: favorites });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách yêu thích');
    }
});
/**
 * Thêm một mục vào danh sách yêu thích
 * - Endpoint: POST /api/v1/users/favorites
 * - Body: { item_type: 'tour' | 'hotel' | 'flight', item_id: string }
 * // (Đã thêm)
 */
const addFavorite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const { item_type, item_id } = req.body;
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        if (!item_type || !item_id) {
            return res.status(400).json({ status: 'error', message: 'Thiếu item_type hoặc item_id' });
        }
        const favorites = yield user_service_1.default.addFavorite(userId, { item_type, item_id });
        return res.status(201).json({ status: 'success', message: 'Đã thêm vào yêu thích', data: favorites });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm yêu thích');
    }
});
/**
 * Xóa một mục khỏi danh sách yêu thích
 * - Endpoint: DELETE /api/v1/users/favorites/:itemType/:itemId
 * // (Đã thêm)
 */
const removeFavorite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const favorites = yield user_service_1.default.removeFavorite(userId, itemType, itemId);
        return res.status(200).json({ status: 'success', message: 'Đã bỏ khỏi yêu thích', data: favorites });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa yêu thích');
    }
});
exports.default = {
    getProfile,
    updateProfile,
    changePassword,
    getMyItinerary,
    getItineraryDetail,
    getFavorites,
    addFavorite,
    removeFavorite,
};
//# sourceMappingURL=user.controller.js.map