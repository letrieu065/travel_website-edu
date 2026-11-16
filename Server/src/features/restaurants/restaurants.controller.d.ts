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
import { Request, Response } from 'express';
/**
 * Lấy danh sách nhà hàng với bộ lọc thành phố, món ăn, số sao và sắp xếp
 * - Endpoint: GET /api/v1/restaurants
 * - Query Params: page, limit, search, city, cuisine, min_rating, sort
 * // (Đã thêm)
 */
declare const getRestaurants: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách các nhà hàng được đánh giá cao nhất (Top Restaurants)
 * - Endpoint: GET /api/v1/restaurants/top?limit=6
 * // (Đã thêm)
 */
declare const getTopRestaurants: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy chi tiết thông tin một nhà hàng theo ID
 * - Endpoint: GET /api/v1/restaurants/:id
 * // (Đã thêm)
 */
declare const getRestaurantById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getRestaurants: typeof getRestaurants;
    getTopRestaurants: typeof getTopRestaurants;
    getRestaurantById: typeof getRestaurantById;
};
export default _default;
