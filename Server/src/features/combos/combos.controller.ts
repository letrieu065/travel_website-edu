/**
 * ============================================================================
 * MODULE COMBOS - CONTROLLER (Xử lý HTTP Request cho Gói Combo Du Lịch)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Điều phối dữ liệu gói combo tích hợp: Tour + Khách sạn + Vé máy bay.
 * - Hỗ trợ gợi ý combo tự động thông minh dựa trên điểm đến và ngân sách.
 * - Trả về response chuẩn RESTful cho Client.
 * ============================================================================
 */

import { Request, Response } from 'express';
import combosService from './combos.service';

/**
 * Xử lý lỗi chuẩn cho Controller
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
 * Lấy danh sách các gói combo thịnh hành nhất
 * - Endpoint: GET /api/v1/combos?limit=6
 * // (Đã thêm)
 */
const getPopularCombos = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 6;
        const combos = await combosService.getPopularCombos(limit);
        return res.status(200).json({ status: 'success', combos });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách combo');
    }
};

/**
 * Gợi ý gói combo thông minh theo điểm đến, ngân sách, số khách và số đêm
 * - Endpoint: POST /api/v1/combos/suggest
 * - Body: ComboSuggestInput
 * // (Đã thêm)
 */
const suggestCombo = async (req: Request, res: Response) => {
    try {
        const result = await combosService.suggestCombo(req.body);
        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gợi ý combo');
    }
};

/**
 * Lấy thông tin combo chi tiết cho một tour cụ thể kèm khách sạn & chuyến bay gợi ý
 * - Endpoint: GET /api/v1/combos/:tourId?guests=2&nights=2
 * // (Đã thêm)
 */
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
