/**
 * ============================================================================
 * MODULE HOTELS - CONTROLLER (Xử lý HTTP Request cho Khách Sạn & Resort)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực query filters (thành phố, số sao, tầm giá, tiện nghi).
 * - Cung cấp danh sách khách sạn thịnh hành và top khách sạn được đánh giá cao.
 * - Kiểm tra tình trạng phòng trống (room availability) theo ngày check-in / check-out.
 * ============================================================================
 */
import { Request, Response } from 'express';
/**
 * Lấy danh sách khách sạn có lọc đa tiêu chí và phân trang
 * - Endpoint: GET /api/v1/hotels
 * - Query Params: page, limit, search, city, star_rating, min_price, max_price, amenities, sort
 * // (Đã thêm)
 */
declare const getHotels: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách các khách sạn thịnh hành (Trending) được du khách ưa chuộng
 * - Endpoint: GET /api/v1/hotels/trending?limit=6
 * // (Đã thêm)
 */
declare const getTrendingHotels: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách top khách sạn có số sao và chất lượng dịch vụ cao nhất
 * - Endpoint: GET /api/v1/hotels/top?limit=6
 * // (Đã thêm)
 */
declare const getTopHotels: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy chi tiết thông tin một khách sạn theo ID kèm hình ảnh và tiện nghi
 * - Endpoint: GET /api/v1/hotels/:id
 * // (Đã thêm)
 */
declare const getHotelById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Kiểm tra số lượng phòng còn trống cho khoảng thời gian lưu trú cụ thể
 * - Endpoint: GET /api/v1/hotels/:id/availability?rooms=1&check_in=...&check_out=...
 * // (Đã thêm)
 */
declare const checkRoomAvailability: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getHotels: typeof getHotels;
    getTrendingHotels: typeof getTrendingHotels;
    getTopHotels: typeof getTopHotels;
    getHotelById: typeof getHotelById;
    checkRoomAvailability: typeof checkRoomAvailability;
};
export default _default;
