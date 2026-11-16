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
/**
 * Tạo lịch trình du lịch thông minh từng ngày bằng AI
 * - Endpoint: POST /api/v1/ai/generate-itinerary
 * - Body: { budget: number, days: number, interests: string[], destination?: string, guests?: number }
 * // (Đã thêm)
 */
declare const generateItinerary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * So sánh từ 2 đến 4 tour du lịch để hỗ trợ quyết định đặt chỗ
 * - Endpoint: POST /api/v1/ai/compare-tours
 * - Body: { tour_ids: string[], priority?: 'budget' | 'rating' | 'duration' }
 * // (Đã thêm)
 */
declare const compareTours: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    generateItinerary: typeof generateItinerary;
    compareTours: typeof compareTours;
};
export default _default;
