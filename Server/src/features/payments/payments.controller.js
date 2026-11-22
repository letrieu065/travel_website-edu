"use strict";
/**
 * ============================================================================
 * MODULE PAYMENTS - CONTROLLER (Xử lý HTTP Request cho Cổng Thanh Toán)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận yêu cầu khởi tạo thanh toán đa phương thức (VietQR, MoMo, VNPay, Trả góp).
 * - Xử lý Webhook IPN từ cổng thanh toán đối tác khi khách hàng chuyển khoản thành công.
 * - Kiểm tra trạng thái giao dịch và xử lý yêu cầu hoàn tiền.
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
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const payments_service_1 = __importDefault(require("./payments.service"));
const env_1 = __importDefault(require("../../config/env"));
/**
 * Xử lý lỗi chuẩn cho Payments Controller
 * // (Đã thêm)
 */
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = (error === null || error === void 0 ? void 0 : error.message) || defaultMessage;
    if (msg.includes('Không tìm thấy') || (error === null || error === void 0 ? void 0 : error.code) === 'P2025' || (error === null || error === void 0 ? void 0 : error.code) === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    if (msg.includes('không có quyền')) {
        return res.status(403).json({ status: 'error', message: msg });
    }
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
        status: 'error',
        message: isProd ? 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau' : msg,
    });
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
 * Trích xuất ID người dùng từ JWT Token
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
 * Khởi tạo giao dịch thanh toán mới cho đơn đặt chỗ
 * - Endpoint: POST /api/v1/payments/create
 * - Body: { booking_id: string, payment_method: PaymentMethod }
 * - Hỗ trợ: 'vietqr', 'momo', 'bank_transfer', 'vnpay', 'f88_loan'
 * // (Đã thêm)
 */
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = extractUserId(req);
        const { booking_id, payment_method } = req.body;
        const validMethods = ['vietqr', 'momo', 'bank_transfer', 'vnpay', 'f88_loan'];
        if (!booking_id || !payment_method) {
            return res.status(400).json({
                status: 'error',
                message: 'Thiếu thông tin: booking_id hoặc payment_method không được để trống',
            });
        }
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({
                status: 'error',
                message: 'Phương thức thanh toán payment_method không hợp lệ',
            });
        }
        const result = yield payments_service_1.default.createPayment({ booking_id, payment_method, user_id: userId });
        return res.status(201).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Không tìm thấy')) {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('không có quyền')) {
            return res.status(403).json({ status: 'error', message: error.message });
        }
        return handleControllerError(res, error, 'Lỗi khi khởi tạo giao dịch thanh toán');
    }
});
/**
 * Xử lý Webhook (Instant Payment Notification - IPN) từ cổng thanh toán
 * - Endpoint: POST /api/v1/payments/webhook
 * - Body: { transaction_id: string, status: 'paid' | 'failed' }
 * // (Đã thêm)
 */
const handlePaymentWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'natura_payment_webhook_secret_2026';
        const signatureHeader = (req.headers['x-webhook-secret'] || req.headers['x-signature']);
        if (!signatureHeader || typeof signatureHeader !== 'string') {
            return res.status(401).json({
                status: 'error',
                message: 'Chữ ký webhook không hợp lệ hoặc thiếu mã bí mật xác thực',
            });
        }
        const signatureBuffer = Buffer.from(signatureHeader);
        const secretBuffer = Buffer.from(webhookSecret);
        if (signatureBuffer.length !== secretBuffer.length || !crypto_1.default.timingSafeEqual(signatureBuffer, secretBuffer)) {
            return res.status(401).json({
                status: 'error',
                message: 'Chữ ký webhook không hợp lệ hoặc thiếu mã bí mật xác thực',
            });
        }
        const { transaction_id, status } = req.body;
        if (!transaction_id || !['paid', 'failed'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Dữ liệu webhook không hợp lệ' });
        }
        const updated = yield payments_service_1.default.processPaymentWebhook(transaction_id, status);
        return res.status(200).json({ status: 'success', data: updated });
    }
    catch (error) {
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Không tìm thấy')) {
            return res.status(404).json({ status: 'error', message: error.message });
        }
        return handleControllerError(res, error, 'Lỗi khi xử lý webhook thanh toán');
    }
});
/**
 * Lấy danh sách lịch sử tất cả các giao dịch thanh toán của người dùng hiện tại
 * - Endpoint: GET /api/v1/payments/my-payments
 * // (Đã thêm)
 */
const getMyPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const payments = yield payments_service_1.default.getMyPayments(userId);
        return res.status(200).json({ status: 'success', payments });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch sử giao dịch');
    }
});
/**
 * Kiểm tra trạng thái thanh toán của một giao dịch cụ thể
 * - Endpoint: GET /api/v1/payments/:id/status
 * // (Đã thêm)
 */
const getPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = getParam(req.params.id);
        const userId = extractUserId(req);
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const payment = yield payments_service_1.default.getPaymentStatus(id, userId, role);
        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy giao dịch hoặc bạn không có quyền truy cập' });
        }
        return res.status(200).json({ status: 'success', payment });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi kiểm tra trạng thái thanh toán');
    }
});
/**
 * Gửi yêu cầu hoàn tiền cho đơn đặt chỗ đã thanh toán
 * - Endpoint: POST /api/v1/payments/:id/refund
 * // (Đã thêm)
 */
const requestRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const updated = yield payments_service_1.default.requestRefund(userId, id);
        return res.status(200).json({ status: 'success', message: 'Đã gửi yêu cầu hoàn tiền', payment: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi yêu cầu hoàn tiền');
    }
});
exports.default = {
    createPayment,
    handlePaymentWebhook,
    getMyPayments,
    getPaymentStatus,
    requestRefund,
};
//# sourceMappingURL=payments.controller.js.map