"use strict";
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
const prisma_1 = __importDefault(require("../../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
/* ============================== SERVICE METHODS ============================== */
const getProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.users.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            auth_provider: true,
            role: true,
            created_at: true,
        },
    });
    if (!user)
        return null;
    return Object.assign(Object.assign({}, user), { fullName: user.full_name, avatarUrl: user.avatar_url, phoneNumber: user.phone_number });
});
const updateProfile = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (data.full_name !== undefined)
        updateData.full_name = data.full_name;
    if (data.phone_number !== undefined)
        updateData.phone_number = data.phone_number;
    if (data.avatar_url !== undefined)
        updateData.avatar_url = data.avatar_url;
    const updated = yield prisma_1.default.users.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            role: true,
        },
    });
    return updated;
});
const changePassword = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.users.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    if (!user.password_hash) {
        throw new Error('Tài khoản đăng nhập qua mạng xã hội không thể đổi mật khẩu trực tiếp');
    }
    const isMatch = yield bcrypt_1.default.compare(data.old_password, user.password_hash);
    if (!isMatch) {
        throw new Error('Mật khẩu hiện tại không chính xác');
    }
    const newHash = yield bcrypt_1.default.hash(data.new_password, 10);
    yield prisma_1.default.users.update({
        where: { id: userId },
        data: { password_hash: newHash },
    });
    return { message: 'Đổi mật khẩu thành công' };
});
// Quản lý hành trình sắp diễn ra + nhắc nhở (Mục 17 User Flow)
const getMyItinerary = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const bookings = yield prisma_1.default.bookings.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
            booking_items: true,
            payments: true,
        },
    });
    const upcomingTrips = bookings.filter((booking) => booking.booking_items.some((item) => item.check_in && new Date(item.check_in) >= now));
    const pastTrips = bookings.filter((booking) => !upcomingTrips.some((up) => up.id === booking.id));
    // Sinh nhắc nhở cho các chuyến đi trong 7 ngày tới
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const reminders = upcomingTrips
        .filter((booking) => booking.booking_items.some((item) => item.check_in &&
        new Date(item.check_in) >= now &&
        new Date(item.check_in) <= sevenDaysLater))
        .map((booking) => ({
        booking_id: booking.id,
        message: 'Bạn có lịch trình du lịch sắp diễn ra trong 7 ngày tới. Vui lòng kiểm tra giấy tờ và hành lý!',
        items: booking.booking_items,
    }));
    return {
        upcomingTrips,
        pastTrips,
        reminders,
        totalBookings: bookings.length,
    };
});
const getItineraryDetail = (userId, bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma_1.default.bookings.findFirst({
        where: { id: bookingId, user_id: userId },
        include: {
            booking_items: true,
            payments: true,
        },
    });
    return booking;
});
// Danh sách yêu thích (TODO: cần bảng favorites trong schema.prisma để lưu lâu dài)
const favoriteStore = new Map();
const getFavorites = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return (_a = favoriteStore.get(userId)) !== null && _a !== void 0 ? _a : [];
});
const addFavorite = (userId, item) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const list = (_a = favoriteStore.get(userId)) !== null && _a !== void 0 ? _a : [];
    const exists = list.some((f) => f.item_id === item.item_id && f.item_type === item.item_type);
    if (!exists) {
        list.push(item);
        favoriteStore.set(userId, list);
    }
    return list;
});
const removeFavorite = (userId, itemType, itemId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const list = (_a = favoriteStore.get(userId)) !== null && _a !== void 0 ? _a : [];
    const updated = list.filter((f) => !(f.item_id === itemId && f.item_type === itemType));
    favoriteStore.set(userId, updated);
    return updated;
});
exports.default = {
    getProfile,
    updateProfile,
    changePassword,
    getMyItinerary,
    getItineraryDetail,
    getFavorites,
    addFavorite,
    removeFavorite,
};
//# sourceMappingURL=user.service.js.map