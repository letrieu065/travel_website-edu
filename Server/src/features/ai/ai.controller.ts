import { Request, Response } from 'express';
import aiService from './ai.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

/* ============================== CONTROLLERS ============================== */

// body: { budget, days, interests, destination, guests }
const generateItinerary = async (req: Request, res: Response) => {
    try {
        const { budget, days, interests, destination, guests } = req.body;
        if (!budget || !days) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập ngân sách (budget) và số ngày (days)' });
        }

        const result = await aiService.generateItinerary({
            budget: Number(budget),
            days: Number(days),
            interests: Array.isArray(interests) ? interests : [],
            destination,
            guests: guests ? Number(guests) : undefined,
        });

        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi AI sinh lịch trình');
    }
};

// body: { tour_ids: string[], priority?: 'budget' | 'rating' | 'duration' }
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

