"use strict";
/**
 * ============================================================================
 * MODULE PAYMENTS - SERVICE (Nghiệp vụ Xử lý Thanh toán & Gửi Mail Xác nhận)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Khởi tạo mã giao dịch duy nhất (transaction_id).
 * - Sinh mã QR VietQR (chuẩn NAPAS 247) và link thanh toán MoMo sandbox.
 * - Xử lý Webhook IPN cập nhật trạng thái đơn sang 'paid' và kích hoạt gửi mail hóa đơn.
 * - Xử lý quy trình hoàn tiền (Refund request).
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
const prisma_1 = __importDefault(require("../../config/prisma"));
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Gửi email tự động xác nhận đặt chỗ và hóa đơn thanh toán qua Nodemailer (Gmail SMTP)
 * // (Đã thêm)
 */
const sendConfirmationEmail = (toEmail, bookingId, amount, method) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.MY_GMAIL || !process.env.GMAIL_APP_PASSWORD)
        return;
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MY_GMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        yield transporter.sendMail({
            from: '"Natura Travel Support" <no-reply@naturatravel.com>',
            to: toEmail,
            subject: `[Natura Travel] Xác nhận thanh toán thành công đơn #${bookingId.slice(0, 8)}`,
            html: `
                <h2>Thanh toán thành công!</h2>
                <p>Cảm ơn bạn đã đặt dịch vụ tại Natura Travel.</p>
                <p><strong>Mã đơn hàng:</strong> ${bookingId}</p>
                <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')} VND</p>
                <p><strong>Phương thức:</strong> ${method}</p>
                <p>Chúc bạn có một chuyến đi tuyệt vời!</p>
            `,
        });
    }
    catch (err) {
        console.error('Lỗi gửi mail xác nhận thanh toán:', err);
    }
});
/* ============================== SERVICE METHODS ============================== */
/**
 * Khởi tạo giao dịch thanh toán trong cơ sở dữ liệu và sinh mã QR/URL thanh toán
 * // (Đã thêm)
 */
const createPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const booking = yield prisma_1.default.bookings.findUnique({
        where: { id: data.booking_id },
        include: { users: true, payments: true },
    });
    if (!booking) {
        throw new Error('Không tìm thấy đơn đặt chỗ');
    }
    if (data.user_id && booking.user_id && booking.user_id !== data.user_id) {
        throw new Error('Bạn không có quyền thanh toán cho đơn đặt chỗ này');
    }
    // Chặn thanh toán nếu đơn đặt chỗ đã có giao dịch hoàn tất thành công
    const existingPaid = (_a = booking.payments) === null || _a === void 0 ? void 0 : _a.find((p) => p.payment_status === 'paid');
    if (existingPaid) {
        throw new Error('Đơn đặt chỗ này đã được thanh toán thành công');
    }
    // Tái sử dụng bản ghi pending cùng phương thức để tránh trùng lặp bản ghi rác
    const existingPending = (_b = booking.payments) === null || _b === void 0 ? void 0 : _b.find((p) => p.payment_status === 'pending' && p.payment_method === data.payment_method);
    let payment = existingPending;
    let transactionId = (payment === null || payment === void 0 ? void 0 : payment.transaction_id) || `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const amount = Number(booking.total_price);
    if (!payment) {
        payment = yield prisma_1.default.payments.create({
            data: {
                booking_id: booking.id,
                amount,
                payment_method: data.payment_method,
                transaction_id: transactionId,
                payment_status: 'pending',
            },
        });
    }
    // Sinh mã QR VietQR hoặc đường dẫn cổng thanh toán Sandbox chuẩn
    let paymentUrl = null;
    if (data.payment_method === 'vnpay') {
        const vnpUrl = new URL('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        vnpUrl.searchParams.set('vnp_Version', '2.1.0');
        vnpUrl.searchParams.set('vnp_Command', 'pay');
        vnpUrl.searchParams.set('vnp_TmnCode', process.env.VNP_TMN_CODE || 'NATURAVN');
        vnpUrl.searchParams.set('vnp_Amount', String(amount * 100));
        vnpUrl.searchParams.set('vnp_CreateDate', new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14));
        vnpUrl.searchParams.set('vnp_CurrCode', 'VND');
        vnpUrl.searchParams.set('vnp_IpAddr', '127.0.0.1');
        vnpUrl.searchParams.set('vnp_Locale', 'vn');
        vnpUrl.searchParams.set('vnp_OrderInfo', `Thanh toan don dat cho ${booking.id}`);
        vnpUrl.searchParams.set('vnp_OrderType', 'other');
        vnpUrl.searchParams.set('vnp_ReturnUrl', process.env.VNP_RETURN_URL || 'http://localhost:3000/checkout/success');
        vnpUrl.searchParams.set('vnp_TxnRef', transactionId);
        paymentUrl = vnpUrl.toString();
    }
    else if (data.payment_method === 'momo') {
        paymentUrl = `https://test-payment.momo.vn/pay/${transactionId}`;
    }
    else if (data.payment_method === 'bank_transfer' || data.payment_method === 'vietqr') {
        paymentUrl = `https://img.vietqr.io/image/MB-0000000000-compact2.png?amount=${amount}&addInfo=${transactionId}`;
    }
    return {
        payment,
        payment_url: paymentUrl,
        transaction_id: transactionId,
    };
});
/**
 * Xử lý cập nhật trạng thái giao dịch từ Webhook cổng thanh toán
 * - Nếu trạng thái là 'paid': Cập nhật thời gian thanh toán và gửi email xác nhận cho khách hàng
 * // (Đã thêm)
 */
const processPaymentWebhook = (transactionId, status) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const payment = yield prisma_1.default.payments.findUnique({
        where: { transaction_id: transactionId },
        include: {
            bookings: {
                include: { users: true },
            },
        },
    });
    if (!payment) {
        throw new Error('Không tìm thấy mã giao dịch');
    }
    const updated = yield prisma_1.default.payments.update({
        where: { id: payment.id },
        data: {
            payment_status: status,
            payment_date: status === 'paid' ? new Date() : payment.payment_date,
        },
    });
    if (status === 'paid' && ((_b = (_a = payment.bookings) === null || _a === void 0 ? void 0 : _a.users) === null || _b === void 0 ? void 0 : _b.email)) {
        yield sendConfirmationEmail(payment.bookings.users.email, payment.booking_id || '', Number(payment.amount), payment.payment_method);
    }
    return updated;
});
/**
 * Lấy lịch sử tất cả các khoản thanh toán của một người dùng
 * // (Đã thêm)
 */
const getMyPayments = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payments.findMany({
        where: {
            bookings: { user_id: userId },
        },
        orderBy: { payment_date: 'desc' },
        include: {
            bookings: {
                include: { booking_items: true },
            },
        },
    });
});
/**
 * Kiểm tra trạng thái giao dịch theo ID (bảo vệ IDOR với userId & role)
 * // (Đã thêm)
 */
const getPaymentStatus = (paymentId, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const where = { id: paymentId };
    if (role !== 'admin' && userId) {
        where.bookings = { user_id: userId };
    }
    return prisma_1.default.payments.findFirst({
        where,
    });
});
/**
 * Gửi yêu cầu hoàn tiền cho giao dịch đã thanh toán
 * // (Đã thêm)
 */
const requestRefund = (userId, paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield prisma_1.default.payments.findFirst({
        where: {
            id: paymentId,
            bookings: { user_id: userId },
        },
    });
    if (!payment) {
        throw new Error('Không tìm thấy giao dịch hoặc bạn không có quyền truy cập');
    }
    if (payment.payment_status !== 'paid') {
        throw new Error('Chỉ có thể yêu cầu hoàn tiền cho giao dịch đã thanh toán');
    }
    return prisma_1.default.payments.update({
        where: { id: paymentId },
        data: { payment_status: 'refund_requested' },
    });
});
exports.default = {
    createPayment,
    processPaymentWebhook,
    getMyPayments,
    getPaymentStatus,
    requestRefund,
};
//# sourceMappingURL=payments.service.js.map