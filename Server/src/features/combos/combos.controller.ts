import { Request, Response } from 'express';
import combosService from './combos.service';

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

// query: limit
const getPopularCombos = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const combos = await combosService.getPopularCombos(limit);
        return res.status(200).json({ status: 'success', combos });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách combo');
    }
};

// body: ComboSuggestInput
const suggestCombo = async (req: Request, res: Response) => {
    try {
        const result = await combosService.suggestCombo(req.body);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gợi ý combo');
    }
};

// params: tourId | query: guests, nights
const getComboByTourId = async (req: Request, res: Response) => {
    try {
        const tourId = getParam(req.params.tourId);
        const guests = Number(req.query.guests) || 2;
        const nights = Number(req.query.nights) || 2;
        const combo = await combosService.getComboByTourId(tourId, guests, nights);
        if (!combo) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy tour để tạo combo' });
        }
        return res.status(200).json({ status: 'success', data: combo });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết combo cho tour');
    }
};

export default {
    getPopularCombos,
    suggestCombo,
    getComboByTourId,
};

