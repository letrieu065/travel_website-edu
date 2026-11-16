"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const combos_service_1 = __importDefault(require("./combos.service"));
/**
 * Xử lý lỗi chuẩn cho Controller
 * // (Đã thêm)
 */
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};
/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/* ============================== CONTROLLERS ============================== */
/**
 * Lấy danh sách các gói combo thịnh hành nhất
 * - Endpoint: GET /api/v1/combos?limit=6
 * // (Đã thêm)
 */
const getPopularCombos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit) || 6;
        const combos = yield combos_service_1.default.getPopularCombos(limit);
        return res.status(200).json({ status: 'success', combos });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách combo');
    }
});
/**
 * Gợi ý gói combo thông minh theo điểm đến, ngân sách, số khách và số đêm
 * - Endpoint: POST /api/v1/combos/suggest
 * - Body: ComboSuggestInput
 * // (Đã thêm)
 */
const suggestCombo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield combos_service_1.default.suggestCombo(req.body);
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gợi ý combo');
    }
});
/**
 * Lấy thông tin combo chi tiết cho một tour cụ thể kèm khách sạn & chuyến bay gợi ý
 * - Endpoint: GET /api/v1/combos/:tourId?guests=2&nights=2
 * // (Đã thêm)
 */
const getComboByTourId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tourId = getParam(req.params.tourId);
        const guests = Number(req.query.guests) || 2;
        const nights = Number(req.query.nights) || 2;
        const combo = yield combos_service_1.default.getComboByTourId(tourId, guests, nights);
        if (!combo) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy tour để tạo combo' });
        }
        return res.status(200).json({ status: 'success', data: combo });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết combo cho tour');
    }
});
exports.default = {
    getPopularCombos,
    suggestCombo,
    getComboByTourId,
};
//# sourceMappingURL=combos.controller.js.map