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
import hotelsService from './hotels.service';

/**
 * Xử lý lỗi chuẩn cho Hotels Controller
 * // (Đã thêm)
 */
const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = error?.message || defaultMessage;
    if (msg.includes('Không tìm thấy') || error?.code === 'P2025' || error?.code === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
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
 * Lấy danh sách khách sạn có lọc đa tiêu chí và phân trang
 * - Endpoint: GET /api/v1/hotels
 * - Query Params: page, limit, search, city, star_rating, min_price, max_price, amenities, sort
 * // (Đã thêm)
 */
const getHotels = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, city, star_rating, min_price, max_price, amenities, sort } = req.query;

        if (star_rating !== undefined) {
            const parsedStar = Number(star_rating);
            if (isNaN(parsedStar) || parsedStar < 1 || parsedStar > 5) {
                return res.status(400).json({ status: 'error', message: 'star_rating phải là số từ 1 đến 5' });
            }
        }
        if (min_price !== undefined && (isNaN(Number(min_price)) || Number(min_price) < 0)) {
            return res.status(400).json({ status: 'error', message: 'min_price phải là số' });
        }
        if (max_price !== undefined && (isNaN(Number(max_price)) || Number(max_price) < 0)) {
            return res.status(400).json({ status: 'error', message: 'max_price phải là số' });
        }

        const amenitiesList = typeof amenities === 'string' && amenities.trim()
            ? amenities.split(',').map((a) => a.trim())
            : undefined;

        const result = await hotelsService.getHotels({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            city: city as string,
            star_rating: star_rating !== undefined ? Number(star_rating) : undefined,
            min_price: min_price !== undefined ? Number(min_price) : undefined,
            max_price: max_price !== undefined ? Number(max_price) : undefined,
            amenities: amenitiesList,
            sort: sort as any,
        });

        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách khách sạn');
    }
};

/**
 * Lấy danh sách các khách sạn thịnh hành (Trending) được du khách ưa chuộng
 * - Endpoint: GET /api/v1/hotels/trending?limit=6
 * // (Đã thêm)
 */
const getTrendingHotels = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const hotels = await hotelsService.getTrendingHotels(limit);
        return res.status(200).json({ status: 'success', hotels });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy khách sạn thịnh hành');
    }
};

/**
 * Lấy danh sách top khách sạn có số sao và chất lượng dịch vụ cao nhất
 * - Endpoint: GET /api/v1/hotels/top?limit=6
 * // (Đã thêm)
 */
const getTopHotels = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const hotels = await hotelsService.getTopHotels(limit);
        return res.status(200).json({ status: 'success', hotels });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top khách sạn');
    }
};

/**
 * Lấy chi tiết thông tin một khách sạn theo ID kèm hình ảnh và tiện nghi
 * - Endpoint: GET /api/v1/hotels/:id
 * // (Đã thêm)
 */
const getHotelById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn (ID không hợp lệ)' });
        }
        const hotel = await hotelsService.getHotelById(id);
        if (!hotel) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn' });
        }
        return res.status(200).json({ status: 'success', hotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết khách sạn');
    }
};

/**
 * Kiểm tra số lượng phòng còn trống cho khoảng thời gian lưu trú cụ thể
 * - Endpoint: GET /api/v1/hotels/:id/availability?rooms=1&check_in=...&check_out=...
 * // (Đã thêm)
 */
const checkRoomAvailability = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn (ID không hợp lệ)' });
        }
        const rooms = Number(req.query.rooms) || 1;
        const checkIn = req.query.check_in as string;
        const checkOut = req.query.check_out as string;

        if (checkIn && checkOut) {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate.getTime() <= checkInDate.getTime()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Ngày trả phòng (check-out) phải sau ngày nhận phòng (check-in)',
                });
            }
        }

        const data = await hotelsService.checkRoomAvailability(id, rooms, checkIn, checkOut);
        if (!data) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn' });
        }
        return res.status(200).json({ status: 'success', data });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi kiểm tra phòng trống');
    }
};

export default {
    getHotels,
    getTrendingHotels,
    getTopHotels,
    getHotelById,
    checkRoomAvailability,
};
