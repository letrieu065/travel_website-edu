import { Request, Response } from 'express';
import toursService from './tours.service';

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

// query: page, limit, search, tour_type, destination, departure_location, min_price, max_price, start_date, min_rating, sort
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

// query: limit
const getFeaturedTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 1;
        const tours = await toursService.getFeaturedTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour nổi bật');
    }
};

// query: limit
const getTrendingTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const tours = await toursService.getTrendingTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour thịnh hành');
    }
};

// query: limit
const getPromotionTours = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const tours = await toursService.getPromotionTours(limit);
        return res.status(200).json({ status: 'success', tours });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy tour ưu đãi');
    }
};

// query: limit
const getTopTourReviews = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 3;
        const reviews = await toursService.getTopTourReviews(limit);
        return res.status(200).json({ status: 'success', reviews });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy đánh giá tour nổi bật');
    }
};

// params: id
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

// params: id
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

