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
import toursService from './tours.service';

/**
 * Xử lý và chuẩn hóa lỗi cho Tours Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== CONTROLLERS ============================== */

/**
 * Lấy danh sách tour du lịch có lọc đa tiêu chí và phân trang
 * - Endpoint: GET /api/v1/tours
 * - Query Params: page, limit, search, tour_type, destination, departure_location, min_price, max_price, start_date, min_rating, sort
 * // (Đã thêm)
 */
const getTours = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            tour_type,
            destination,
            departure_location,
            min_price,
            max_price,
            start_date,
            min_rating,
            sort,
        } = req.query;

        const result = await toursService.getTours({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            tour_type: tour_type as string,
            destination: destination as string,
            departure_location: departure_location as string,
            min_price: min_price !== undefined ? Number(min_price) : undefined,
            max_price: max_price !== undefined ? Number(max_price) : undefined,
            start_date: start_date as string,
            min_rating: min_rating !== undefined ? Number(min_rating) : undefined,
            sort: sort as any,
        });

        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách tour');
    }
};

/**
 * Lấy tour tiêu biểu nổi bật nhất trang chủ
 * - Endpoint: GET /api/v1/tours/featured?limit=1
 * // (Đã thêm)
 */
const getFeaturedTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 1;
        const tours = await toursService.getFeaturedTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour nổi bật');
    }
};

/**
 * Lấy danh sách tour thịnh hành (Trending) được nhiều du khách quan tâm
 * - Endpoint: GET /api/v1/tours/trending?limit=3
 * // (Đã thêm)
 */
const getTrendingTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const tours = await toursService.getTrendingTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour thịnh hành');
    }
};

/**
 * Lấy danh sách tour đang có chương trình khuyến mãi giảm giá đặc biệt
 * - Endpoint: GET /api/v1/tours/promotion?limit=3
 * // (Đã thêm)
 */
const getPromotionTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const tours = await toursService.getPromotionTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour ưu đãi');
    }
};

/**
 * Lấy danh sách đánh giá & review cao nhất của khách hàng về các tour
 * - Endpoint: GET /api/v1/tours/reviews/top?limit=3
 * // (Đã thêm)
 */
const getTopTourReviews = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const reviews = await toursService.getTopTourReviews(limit);
        return res.status(200).json({ status: 'success', reviews });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy đánh giá tour nổi bật');
    }
};

/**
 * Lấy thông tin chi tiết một tour du lịch theo ID kèm hình ảnh và các ngày khởi hành
 * - Endpoint: GET /api/v1/tours/:id
 * // (Đã thêm)
 */
const getTourById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const tour = await toursService.getTourById(id);
        if (!tour) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy tour' });
        }
        return res.status(200).json({ status: 'success', tour });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết tour');
    }
};

/**
 * Lấy danh sách các đợt khởi hành còn ghế trống của một tour
 * - Endpoint: GET /api/v1/tours/:id/departures
 * // (Đã thêm)
 */
const getTourDepartures = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const departures = await toursService.getTourDepartures(id);
        return res.status(200).json({ status: 'success', departures });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch khởi hành của tour');
    }
};

export default {
    getTours,
    getFeaturedTours,
    getTrendingTours,
    getPromotionTours,
    getTopTourReviews,
    getTourById,
    getTourDepartures,
};
