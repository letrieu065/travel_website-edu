/**
 * ============================================================================
 * MODULE BOOKINGS - SERVICE (Xử lý Nghiệp vụ Đặt chỗ & Quản lý Kho)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Thực thi nghiệp vụ đặt chỗ giao dịch nguyên tử ($transaction ACID của Prisma).
 * - Kiểm tra số lượng chỗ còn trống (available_seats, available_rooms).
 * - Tự động trừ số lượng khả dụng khi đặt chỗ và hoàn trả khi hủy.
 * - Tính toán chính xác tổng tiền, áp dụng voucher giảm giá.
 * ============================================================================
 */
/**
 * Cấu trúc dữ liệu từng mục dịch vụ trong đơn đặt chỗ
 */
export interface BookingItemInput {
    item_type: 'tour' | 'hotel' | 'flight';
    item_id: string;
    quantity: number;
    check_in?: string;
    check_out?: string;
}
/**
 * Dữ liệu đầu vào để tạo mới đơn đặt chỗ
 */
export interface CreateBookingData {
    user_id: string;
    items: BookingItemInput[];
    payment_method?: string;
    discount_amount?: number;
}
/**
 * Tạo mới đơn đặt chỗ sử dụng Prisma Transaction
 * - Đảm bảo tính toàn vẹn dữ liệu: Nếu một dịch vụ hết chỗ, toàn bộ đơn sẽ rollback
 * - Cập nhật kho (decrement seats/rooms)
 * - Tự động khởi tạo bản ghi thanh toán nếu có payment_method
 * // (Đã thêm)
 */
declare const createBooking: (data: CreateBookingData) => Promise<{
    booking_items: {
        booking_id: string;
        item_type: string;
        quantity: number;
        unit_price: import("@prisma/client-runtime-utils").Decimal;
        check_in: Date | null;
        check_out: Date | null;
        item_id: string;
    }[];
    payments: {
        id: string;
        booking_id: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string;
        transaction_id: string | null;
        payment_status: string | null;
        payment_date: Date | null;
    }[];
} & {
    id: string;
    user_id: string | null;
    total_price: import("@prisma/client-runtime-utils").Decimal;
    created_at: Date | null;
}>;
/**
 * Lấy danh sách đơn đặt chỗ của người dùng với phân trang
 * // (Đã thêm)
 */
declare const getMyBookings: (userId: string, pageInput?: number, limitInput?: number) => Promise<{
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
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
/**
 * Lấy chi tiết đơn đặt chỗ theo ID của người dùng sở hữu
 * // (Đã thêm)
 */
declare const getBookingById: (userId: string, bookingId: string) => Promise<({
    booking_items: {
        booking_id: string;
        item_type: string;
        quantity: number;
        unit_price: import("@prisma/client-runtime-utils").Decimal;
        check_in: Date | null;
        check_out: Date | null;
        item_id: string;
    }[];
    payments: {
        id: string;
        booking_id: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string;
        transaction_id: string | null;
        payment_status: string | null;
        payment_date: Date | null;
    }[];
} & {
    id: string;
    user_id: string | null;
    total_price: import("@prisma/client-runtime-utils").Decimal;
    created_at: Date | null;
}) | null>;
/**
 * Hủy đơn đặt chỗ và hoàn trả số lượng ghế / phòng khả dụng về kho
 * - Nếu đã thanh toán: Cập nhật payment_status thành 'refund_requested'
 * - Nếu chưa thanh toán: Chuyển payment_status sang 'failed'
 * - Tự động hoàn trả available_seats / available_rooms
 * // (Đã thêm)
 */
declare const cancelBooking: (userId: string, bookingId: string) => Promise<{
    booking_id: string;
    cancelled: boolean;
    refund_required: boolean;
    message: string;
}>;
declare const _default: {
    createBooking: typeof createBooking;
    getMyBookings: typeof getMyBookings;
    getBookingById: typeof getBookingById;
    cancelBooking: typeof cancelBooking;
};
export default _default;
