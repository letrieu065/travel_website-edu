import { Request, Response } from 'express';
import restaurantsService from './restaurants.service';

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

// query: page, limit, search, city, cuisine, min_rating, sort
const getRestaurants = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, city, cuisine, min_rating, sort } = req.query;
        const result = await restaurantsService.getRestaurants({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            city: city as string,
            cuisine: cuisine as string,
            min_rating: min_rating !== undefined ? Number(min_rating) : undefined,
            sort: sort as any,
        });
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách nhà hàng');
    }
};

// query: limit
const getTopRestaurants = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const restaurants = await restaurantsService.getTopRestaurants(limit);
        return res.status(200).json({ status: 'success', restaurants });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top nhà hàng');
    }
};

// params: id
const getRestaurantById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const restaurant = await restaurantsService.getRestaurantById(id);
        if (!restaurant) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy nhà hàng' });
        }
        return res.status(200).json({ status: 'success', restaurant });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết nhà hàng');
    }
};

export default {
    getRestaurants,
    getTopRestaurants,
    getRestaurantById,
};

