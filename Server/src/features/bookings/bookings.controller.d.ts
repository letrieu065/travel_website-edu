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
import { Request, Response } from 'express';
/**
 * Tạo mới đơn đặt chỗ dịch vụ đa thể loại (Tour, Khách sạn, Chuyến bay hoặc Combo)
 * - Endpoint: POST /api/v1/bookings
 * - Yêu cầu xác thực: Bearer Token
 * - Body: { items: BookingItemInput[], payment_method?: string, discount_amount?: number }
 * // (Đã thêm)
 */
declare const createBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách lịch sử các đơn đặt chỗ của người dùng hiện tại có phân trang
 * - Endpoint: GET /api/v1/bookings/my-bookings?page=1&limit=10
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
declare const getMyBookings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy chi tiết đơn đặt chỗ bao gồm danh sách dịch vụ và trạng thái giao dịch thanh toán
 * - Endpoint: GET /api/v1/bookings/:id
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
declare const getBookingById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Hủy đơn đặt chỗ và tự động hoàn trả số lượng ghế / phòng khả dụng về kho
 * - Endpoint: PATCH /api/v1/bookings/:id/cancel
 * - Yêu cầu xác thực: Bearer Token
 * // (Đã thêm)
 */
declare const cancelBooking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    createBooking: typeof createBooking;
    getMyBookings: typeof getMyBookings;
    getBookingById: typeof getBookingById;
    cancelBooking: typeof cancelBooking;
};
export default _default;
