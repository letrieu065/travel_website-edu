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
/**
 * Lấy danh sách các gói combo thịnh hành nhất
 * - Endpoint: GET /api/v1/combos?limit=6
 * // (Đã thêm)
 */
declare const getPopularCombos: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Gợi ý gói combo thông minh theo điểm đến, ngân sách, số khách và số đêm
 * - Endpoint: POST /api/v1/combos/suggest
 * - Body: ComboSuggestInput
 * // (Đã thêm)
 */
declare const suggestCombo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy thông tin combo chi tiết cho một tour cụ thể kèm khách sạn & chuyến bay gợi ý
 * - Endpoint: GET /api/v1/combos/:tourId?guests=2&nights=2
 * // (Đã thêm)
 */
declare const getComboByTourId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getPopularCombos: typeof getPopularCombos;
    suggestCombo: typeof suggestCombo;
    getComboByTourId: typeof getComboByTourId;
};
export default _default;
