/**
 * ============================================================================
 * MODULE USERS - CONTROLLER (Xử lý HTTP Request cho Hồ Sơ & Hành Trình Cá Nhân)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực thông tin tài khoản người dùng (Profile, Password).
 * - Cung cấp danh sách hành trình sắp diễn ra và lịch sử chuyến đi của người dùng.
 * - Quản lý danh sách các điểm đến / tour yêu thích (Favorites).
 * ============================================================================
 */
import { Request, Response } from 'express';
/**
 * Lấy thông tin hồ sơ chi tiết của người dùng hiện tại
 * - Endpoint: GET /api/v1/users/profile
 * // (Đã thêm)
 */
declare const getProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Cập nhật thông tin hồ sơ người dùng (họ tên, số điện thoại, avatar)
 * - Endpoint: PUT /api/v1/users/profile
 * - Body: { full_name?: string, phone_number?: string, avatar_url?: string }
 * // (Đã thêm)
 */
declare const updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Đổi mật khẩu tài khoản người dùng
 * - Endpoint: PATCH /api/v1/users/change-password
 * - Body: { old_password, new_password }
 * // (Đã thêm)
 */
declare const changePassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách các chuyến đi sắp tới và lịch sử hành trình cũ của người dùng
 * - Endpoint: GET /api/v1/users/itinerary
 * // (Đã thêm)
 */
declare const getMyItinerary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy chi tiết lịch trình một chuyến đi theo mã đặt chỗ (bookingId)
 * - Endpoint: GET /api/v1/users/itinerary/:bookingId
 * // (Đã thêm)
 */
declare const getItineraryDetail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách dịch vụ và điểm đến yêu thích của người dùng
 * - Endpoint: GET /api/v1/users/favorites
 * // (Đã thêm)
 */
declare const getFavorites: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Thêm một mục vào danh sách yêu thích
 * - Endpoint: POST /api/v1/users/favorites
 * - Body: { item_type: 'tour' | 'hotel' | 'flight', item_id: string }
 * // (Đã thêm)
 */
declare const addFavorite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Xóa một mục khỏi danh sách yêu thích
 * - Endpoint: DELETE /api/v1/users/favorites/:itemType/:itemId
 * // (Đã thêm)
 */
declare const removeFavorite: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getProfile: typeof getProfile;
    updateProfile: typeof updateProfile;
    changePassword: typeof changePassword;
    getMyItinerary: typeof getMyItinerary;
    getItineraryDetail: typeof getItineraryDetail;
    getFavorites: typeof getFavorites;
    addFavorite: typeof addFavorite;
    removeFavorite: typeof removeFavorite;
};
export default _default;
