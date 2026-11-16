"use strict";
/**
 * ============================================================================
 * MODULE RESTAURANTS - CONTROLLER (Xử lý HTTP Request cho Ẩm Thực Bản Địa)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Khám phá các nhà hàng, quán ăn đặc sản theo phong cách Lonely Planet Food & Dining.
 * - Lọc theo thành phố, phong cách ẩm thực (hải sản, truyền thống, Á-Âu) và mức giá trung bình.
 * - Hỗ trợ đặt bàn trước tại các nhà hàng đối tác.
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
const restaurants_service_1 = __importDefault(require("./restaurants.service"));
/**
 * Xử lý lỗi chuẩn cho Restaurants Controller
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
 * Lấy danh sách nhà hàng với bộ lọc thành phố, món ăn, số sao và sắp xếp
 * - Endpoint: GET /api/v1/restaurants
 * - Query Params: page, limit, search, city, cuisine, min_rating, sort
 * // (Đã thêm)
 */
const getRestaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search, city, cuisine, min_rating, sort } = req.query;
        const result = yield restaurants_service_1.default.getRestaurants({
            page: Number(page),
            limit: Number(limit),
            search: search,
            city: city,
            cuisine: cuisine,
            min_rating: min_rating !== undefined ? Number(min_rating) : undefined,
            sort: sort,
        });
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách nhà hàng');
    }
});
/**
 * Lấy danh sách các nhà hàng được đánh giá cao nhất (Top Restaurants)
 * - Endpoint: GET /api/v1/restaurants/top?limit=6
 * // (Đã thêm)
 */
const getTopRestaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit) || 6;
        const restaurants = yield restaurants_service_1.default.getTopRestaurants(limit);
        return res.status(200).json({ status: 'success', restaurants });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top nhà hàng');
    }
});
/**
 * Lấy chi tiết thông tin một nhà hàng theo ID
 * - Endpoint: GET /api/v1/restaurants/:id
 * // (Đã thêm)
 */
const getRestaurantById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const restaurant = yield restaurants_service_1.default.getRestaurantById(id);
        if (!restaurant) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy nhà hàng' });
        }
        return res.status(200).json({ status: 'success', restaurant });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết nhà hàng');
    }
});
exports.default = {
    getRestaurants,
    getTopRestaurants,
    getRestaurantById,
};
//# sourceMappingURL=restaurants.controller.js.map