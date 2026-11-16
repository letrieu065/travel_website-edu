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
// (Đã thêm)
const getPagination = (pageInput, limitInput) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
// (Đã thêm)
const attachHotelMetrics = (hotels) => __awaiter(void 0, void 0, void 0, function* () {
    if (hotels.length === 0)
        return [];
    const hotelIds = hotels.map((h) => h.id);
    const reviewStats = yield prisma_1.default.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'hotel',
            item_id: { in: hotelIds },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const statsMap = new Map(reviewStats.map((s) => { var _a; return [
        s.item_id,
        {
            averageRating: Number(((_a = s._avg.rating) !== null && _a !== void 0 ? _a : 0).toFixed(1)),
            reviewCount: s._count.rating,
        },
    ]; }));
    return hotels.map((hotel) => {
        var _a, _b;
        const stat = (_a = statsMap.get(hotel.id)) !== null && _a !== void 0 ? _a : { averageRating: 0, reviewCount: 0 };
        return Object.assign(Object.assign({}, hotel), { price_per_night: Number(hotel.price_per_night), discount_price: hotel.discount_price ? Number(hotel.discount_price) : null, images: ((_b = hotel.hotel_images) !== null && _b !== void 0 ? _b : []).map((img) => img.url), averageRating: stat.averageRating, reviewCount: stat.reviewCount });
    });
});
/* ============================== SERVICE METHODS ============================== */
const getHotels = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where = {};
    if (params.search) {
        where.OR = [
            { name: { contains: params.search, mode: 'insensitive' } },
            { city: { contains: params.search, mode: 'insensitive' } },
            { address: { contains: params.search, mode: 'insensitive' } },
        ];
    }
    if (params.city) {
        where.city = { contains: params.city, mode: 'insensitive' };
    }
    if (params.star_rating !== undefined) {
        where.star_rating = Number(params.star_rating);
    }
    if (params.min_price !== undefined || params.max_price !== undefined) {
        where.price_per_night = Object.assign(Object.assign({}, (params.min_price !== undefined ? { gte: params.min_price } : {})), (params.max_price !== undefined ? { lte: params.max_price } : {}));
    }
    if (params.amenities && params.amenities.length > 0) {
        where.amenities = { hasEvery: params.amenities };
    }
    const hotelsRaw = yield prisma_1.default.hotels.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });
    let formatted = yield attachHotelMetrics(hotelsRaw);
    if (params.sort === 'price_asc') {
        formatted.sort((a, b) => { var _a, _b; return ((_a = a.discount_price) !== null && _a !== void 0 ? _a : a.price_per_night) - ((_b = b.discount_price) !== null && _b !== void 0 ? _b : b.price_per_night); });
    }
    else if (params.sort === 'price_desc') {
        formatted.sort((a, b) => { var _a, _b; return ((_a = b.discount_price) !== null && _a !== void 0 ? _a : b.price_per_night) - ((_b = a.discount_price) !== null && _b !== void 0 ? _b : a.price_per_night); });
    }
    else if (params.sort === 'star_desc') {
        formatted.sort((a, b) => { var _a, _b; return ((_a = b.star_rating) !== null && _a !== void 0 ? _a : 0) - ((_b = a.star_rating) !== null && _b !== void 0 ? _b : 0); });
    }
    else if (params.sort === 'rating_desc') {
        formatted.sort((a, b) => b.averageRating - a.averageRating);
    }
    const total = formatted.length;
    const hotels = formatted.slice(skip, skip + limit);
    return { hotels, total, page, limit };
});
const getTrendingHotels = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    const hotelsRaw = yield prisma_1.default.hotels.findMany({
        where: { is_trending: true },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });
    return attachHotelMetrics(hotelsRaw);
});
const getTopHotels = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    const hotelsRaw = yield prisma_1.default.hotels.findMany({
        orderBy: { star_rating: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });
    const formatted = yield attachHotelMetrics(hotelsRaw);
    formatted.sort((a, b) => b.averageRating - a.averageRating);
    return formatted.slice(0, limit);
});
const getHotelById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const hotel = yield prisma_1.default.hotels.findUnique({
        where: { id },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });
    if (!hotel)
        return null;
    const reviews = yield prisma_1.default.reviews.findMany({
        where: { item_type: 'hotel', item_id: id },
        orderBy: { created_at: 'desc' },
        include: {
            users: {
                select: { id: true, full_name: true, avatar_url: true },
            },
        },
    });
    const formatted = yield attachHotelMetrics([hotel]);
    return Object.assign(Object.assign({}, formatted[0]), { reviews });
});
const checkRoomAvailability = (id_1, ...args_1) => __awaiter(void 0, [id_1, ...args_1], void 0, function* (id, roomsNeeded = 1, checkIn, checkOut) {
    const hotel = yield prisma_1.default.hotels.findUnique({ where: { id } });
    if (!hotel)
        return null;
    let nights = 1;
    if (checkIn && checkOut) {
        const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
    const pricePerNight = hotel.discount_price ? Number(hotel.discount_price) : Number(hotel.price_per_night);
    return {
        hotel_id: hotel.id,
        available_rooms: hotel.available_rooms,
        is_available: hotel.available_rooms >= roomsNeeded,
        nights,
        price_per_night: pricePerNight,
        estimated_total: pricePerNight * roomsNeeded * nights,
    };
});
exports.default = {
    getHotels,
    getTrendingHotels,
    getTopHotels,
    getHotelById,
    checkRoomAvailability,
};
//# sourceMappingURL=hotels.service.js.map