/**
 * ============================================================================
 * MODULE AI - CONTROLLER (Trợ Lý AI Lập Lịch Trình & So Sánh Tours)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận yêu cầu tạo lịch trình thông minh dựa trên ngân sách, số ngày, sở thích.
 * - Tích hợp mô hình ngôn ngữ lớn Google Gemini AI để sinh lời khuyên (narrative).
 * - Cung cấp tính năng so sánh đa chiều giữa các tour du lịch (so sánh giá, rating, độ dài).
 * ============================================================================
 */

import { Request, Response } from 'express';
import aiService from './ai.service';

/**
 * Xử lý lỗi chuẩn cho AI Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

/* ============================== CONTROLLERS ============================== */

/**
 * Tạo lịch trình du lịch thông minh từng ngày bằng AI
 * - Endpoint: POST /api/v1/ai/generate-itinerary
 * - Body: { budget: number, days: number, interests: string[], destination?: string, guests?: number }
 * // (Đã thêm)
 */
const generateItinerary = async (req: Request, res: Response) => {
    try {
        const { budget, days, interests, destination, guests, departure_location, departureLocation } = req.body;
        if (!budget) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập ngân sách chuyến đi (budget)' });
        }

        const result = await aiService.generateItinerary({
            budget: Number(budget),
            days: days ? Number(days) : 3,
            interests: Array.isArray(interests) ? interests : [],
            destination,
            departure_location: departure_location || departureLocation,
            guests: guests ? Number(guests) : 2,
        });

        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi AI sinh lịch trình');
    }
};

/**
 * So sánh từ 2 đến 4 tour du lịch để hỗ trợ quyết định đặt chỗ
 * - Endpoint: POST /api/v1/ai/compare-tours
 * - Body: { tour_ids: string[], priority?: 'budget' | 'rating' | 'duration' }
 * // (Đã thêm)
 */
const compareTours = async (req: Request, res: Response) => {
    try {
        const { tour_ids, priority } = req.body;
        if (!Array.isArray(tour_ids) || tour_ids.length < 2 || tour_ids.length > 4) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng chọn từ 2 đến 4 tour để so sánh' });
        }

        const result = await aiService.compareTours({ tour_ids, priority });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi AI so sánh tour');
    }
};

export default {
    generateItinerary,
    compareTours,
};
