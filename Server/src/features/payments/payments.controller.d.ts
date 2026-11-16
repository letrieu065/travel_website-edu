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
import { Request, Response } from 'express';
/**
 * Khởi tạo giao dịch thanh toán mới cho đơn đặt chỗ
 * - Endpoint: POST /api/v1/payments/create
 * - Body: { booking_id: string, payment_method: PaymentMethod }
 * - Hỗ trợ: 'momo', 'bank_transfer', 'vnpay', 'f88_loan'
 * // (Đã thêm)
 */
declare const createPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xử lý Webhook (Instant Payment Notification - IPN) từ cổng thanh toán
 * - Endpoint: POST /api/v1/payments/webhook
 * - Body: { transaction_id: string, status: 'paid' | 'failed' }
 * // (Đã thêm)
 */
declare const handlePaymentWebhook: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách lịch sử tất cả các giao dịch thanh toán của người dùng hiện tại
 * - Endpoint: GET /api/v1/payments/my-payments
 * // (Đã thêm)
 */
declare const getMyPayments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Kiểm tra trạng thái thanh toán của một giao dịch cụ thể
 * - Endpoint: GET /api/v1/payments/:id/status
 * // (Đã thêm)
 */
declare const getPaymentStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Gửi yêu cầu hoàn tiền cho đơn đặt chỗ đã thanh toán
 * - Endpoint: POST /api/v1/payments/:id/refund
 * // (Đã thêm)
 */
declare const requestRefund: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    createPayment: typeof createPayment;
    handlePaymentWebhook: typeof handlePaymentWebhook;
    getMyPayments: typeof getMyPayments;
    getPaymentStatus: typeof getPaymentStatus;
    requestRefund: typeof requestRefund;
};
export default _default;
