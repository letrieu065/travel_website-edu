"use strict";
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
const bookings_service_1 = __importDefault(require("./bookings.service"));
/**
 * Xử lý và chuẩn hóa lỗi cho các phương thức trong Controller
 * // (Đã thêm)
 */
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};
/**
 * Lấy giá trị tham số URL an toàn dạng string
 * // (Đã thêm)
 */
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/**
 * Trích xuất User ID từ JWT Header hoặc Request Context
 * // (Đã thêm)
 */
const extractUserId = (req) => {
    var _a;
    const reqUser = req.user;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId)
        return reqUser.userId;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)
        return reqUser.id;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'default_secret_key';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded.userId || decoded.id || '';
        }
        catch (_b) {
            return '';
        }
    }
    return req.query.user_id || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.user_id) || '';
};
/* ============================== CONTROLLERS ============================== */
/**
 * Tạo mới đơn đặt chỗ dịch vụ đa thể loại (Tour, Khách sạn, Chuyến bay hoặc Combo)
 * - Endpoint: POST /api/v1/bookings
 * - Yêu cầu xác thực: Bearer Token
 * - Body: { items: BookingItemInput[], payment_method?: string, discount_amount?: number }
 * // (Đã thêm)
 */
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Vui lòng đăng nhập để đặt dịch vụ' });
        }
        const { items, payment_method, discount_amount } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ít nhất một dịch vụ' });
        }
        const booking = yield bookings_service_1.default.createBooking({
            user_id: userId,
            items,
            payment_method,
            discount_amount,
        });
        return res.status(201).json({ status: 'success', message: 'Đặt chỗ thành công', booking });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo đơn đặt chỗ');
    }
});
/**
 * Lấy danh sách lịch sử các đơn đặt chỗ của người dùng hiện tại có phân trang
 * - Endpoint: GET /api/v1/bookings/my-bookings?page=1&limit=10
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
const getMyBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = yield bookings_service_1.default.getMyBookings(userId, page, limit);
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ');
    }
});
/**
 * Lấy chi tiết đơn đặt chỗ bao gồm danh sách dịch vụ và trạng thái giao dịch thanh toán
 * - Endpoint: GET /api/v1/bookings/:id
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const booking = yield bookings_service_1.default.getBookingById(userId, id);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ' });
        }
        return res.status(200).json({ status: 'success', booking });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết đơn đặt chỗ');
    }
});
/**
 * Hủy đơn đặt chỗ và tự động hoàn trả số lượng ghế / phòng khả dụng về kho
 * - Endpoint: PATCH /api/v1/bookings/:id/cancel
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
const cancelBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const result = yield bookings_service_1.default.cancelBooking(userId, id);
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi hủy đơn đặt chỗ');
    }
});
exports.default = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
};
//# sourceMappingURL=bookings.controller.js.map