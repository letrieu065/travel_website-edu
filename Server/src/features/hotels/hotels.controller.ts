import { Request, Response } from 'express';
import hotelsService from './hotels.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== CONTROLLERS ============================== */

// query: page, limit, search, city, star_rating, min_price, max_price, amenities (comma-separated), sort
const getHotels = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, city, star_rating, min_price, max_price, amenities, sort } = req.query;
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

// query: limit
const getTrendingHotels = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const hotels = await hotelsService.getTrendingHotels(limit);
        return res.status(200).json({ status: 'success', hotels });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy khách sạn thịnh hành');
    }
};

// query: limit
const getTopHotels = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const hotels = await hotelsService.getTopHotels(limit);
        return res.status(200).json({ status: 'success', hotels });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top khách sạn');
    }
};

// params: id
const getHotelById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const hotel = await hotelsService.getHotelById(id);
        if (!hotel) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn' });
        }
        return res.status(200).json({ status: 'success', hotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết khách sạn');
    }
};

// params: id | query: rooms, check_in, check_out
const checkRoomAvailability = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const rooms = Number(req.query.rooms) || 1;
        const checkIn = req.query.check_in as string;
        const checkOut = req.query.check_out as string;

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

