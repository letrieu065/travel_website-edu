/**
 * ============================================================================
 * MODULE TOURS - CONTROLLER (Xử lý HTTP Request cho Tour Du Lịch)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực query filters (điểm đến, giá, ngày khởi hành, loại tour).
 * - Cung cấp API danh sách tour, tour nổi bật (featured), tour thịnh hành (trending).
 * - Cung cấp chi tiết tour, các điểm đến trong hành trình và các đợt khởi hành (departures).
 * ============================================================================
 */
import { Request, Response } from 'express';
/**
 * Lấy danh sách tour du lịch có lọc đa tiêu chí và phân trang
 * - Endpoint: GET /api/v1/tours
 * - Query Params: page, limit, search, tour_type, destination, departure_location, min_price, max_price, start_date, min_rating, sort
 * // (Đã thêm)
 */
declare const getTours: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy tour tiêu biểu nổi bật nhất trang chủ
 * - Endpoint: GET /api/v1/tours/featured?limit=1
 * // (Đã thêm)
 */
declare const getFeaturedTours: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách tour thịnh hành (Trending) được nhiều du khách quan tâm
 * - Endpoint: GET /api/v1/tours/trending?limit=3
 * // (Đã thêm)
 */
declare const getTrendingTours: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách tour đang có chương trình khuyến mãi giảm giá đặc biệt
 * - Endpoint: GET /api/v1/tours/promotion?limit=3
 * // (Đã thêm)
 */
declare const getPromotionTours: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách đánh giá & review cao nhất của khách hàng về các tour
 * - Endpoint: GET /api/v1/tours/reviews/top?limit=3
 * // (Đã thêm)
 */
declare const getTopTourReviews: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy thông tin chi tiết một tour du lịch theo ID kèm hình ảnh và các ngày khởi hành
 * - Endpoint: GET /api/v1/tours/:id
 * // (Đã thêm)
 */
declare const getTourById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách các đợt khởi hành còn ghế trống của một tour
 * - Endpoint: GET /api/v1/tours/:id/departures
 * // (Đã thêm)
 */
declare const getTourDepartures: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getTours: typeof getTours;
    getFeaturedTours: typeof getFeaturedTours;
    getTrendingTours: typeof getTrendingTours;
    getPromotionTours: typeof getPromotionTours;
    getTopTourReviews: typeof getTopTourReviews;
    getTourById: typeof getTourById;
    getTourDepartures: typeof getTourDepartures;
};
export default _default;
