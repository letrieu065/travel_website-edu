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
/**
 * Các phương thức thanh toán được hỗ trợ trong hệ thống Natura Travel
 */
export type PaymentMethod = 'momo' | 'bank_transfer' | 'vnpay' | 'f88_loan';
/**
 * Dữ liệu yêu cầu khởi tạo thanh toán
 */
export interface CreatePaymentData {
    booking_id: string;
    payment_method: PaymentMethod;
}
/**
 * Khởi tạo giao dịch thanh toán trong cơ sở dữ liệu và sinh mã QR/URL thanh toán
 * // (Đã thêm)
 */
declare const createPayment: (data: CreatePaymentData) => Promise<{
    payment: {
        id: string;
        booking_id: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string;
        transaction_id: string | null;
        payment_status: string | null;
        payment_date: Date | null;
    };
    payment_url: string | null;
    transaction_id: string;
}>;
/**
 * Xử lý cập nhật trạng thái giao dịch từ Webhook cổng thanh toán
 * - Nếu trạng thái là 'paid': Cập nhật thời gian thanh toán và gửi email xác nhận cho khách hàng
 * // (Đã thêm)
 */
declare const processPaymentWebhook: (transactionId: string, status: 'paid' | 'failed') => Promise<{
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}>;
/**
 * Lấy lịch sử tất cả các khoản thanh toán của một người dùng
 * // (Đã thêm)
 */
declare const getMyPayments: (userId: string) => Promise<({
    bookings: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    }) | null;
} & {
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
})[]>;
/**
 * Kiểm tra trạng thái giao dịch theo ID
 * // (Đã thêm)
 */
declare const getPaymentStatus: (paymentId: string) => Promise<{
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
} | null>;
/**
 * Gửi yêu cầu hoàn tiền cho giao dịch đã thanh toán
 * // (Đã thêm)
 */
declare const requestRefund: (userId: string, paymentId: string) => Promise<{
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}>;
declare const _default: {
    createPayment: typeof createPayment;
    processPaymentWebhook: typeof processPaymentWebhook;
    getMyPayments: typeof getMyPayments;
    getPaymentStatus: typeof getPaymentStatus;
    requestRefund: typeof requestRefund;
};
export default _default;
