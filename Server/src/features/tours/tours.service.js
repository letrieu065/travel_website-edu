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
const attachTourMetrics = (tours) => __awaiter(void 0, void 0, void 0, function* () {
    if (tours.length === 0)
        return [];
    const tourIds = tours.map((t) => t.id);
    const reviewStats = yield prisma_1.default.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'tour',
            item_id: { in: tourIds },
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
    return tours.map((tour) => {
        var _a;
        var _b, _c, _d, _e;
        const nextDeparture = (_a = tour.tour_departures) === null || _a === void 0 ? void 0 : _a[0];
        const stat = (_b = statsMap.get(tour.id)) !== null && _b !== void 0 ? _b : { averageRating: 0, reviewCount: 0 };
        return {
            id: tour.id,
            title: tour.title,
            description: tour.description,
            tourType: tour.tour_type,
            price: nextDeparture ? Number(nextDeparture.price) : 0,
            discountPrice: (nextDeparture === null || nextDeparture === void 0 ? void 0 : nextDeparture.discount_price) ? Number(nextDeparture.discount_price) : null,
            duration: tour.duration,
            destination: tour.destination,
            departureLocation: tour.departure_location,
            startDate: (nextDeparture === null || nextDeparture === void 0 ? void 0 : nextDeparture.start_date) ? nextDeparture.start_date.toISOString() : '',
            availableSeats: (_c = nextDeparture === null || nextDeparture === void 0 ? void 0 : nextDeparture.available_seats) !== null && _c !== void 0 ? _c : 0,
            images: ((_d = tour.tour_images) !== null && _d !== void 0 ? _d : []).map((img) => img.url),
            isTrending: tour.is_trending,
            averageRating: stat.averageRating,
            reviewCount: stat.reviewCount,
            departures: (_e = tour.tour_departures) !== null && _e !== void 0 ? _e : [],
        };
    });
});
/* ============================== SERVICE METHODS ============================== */
const getTours = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where = {};
    if (params.search) {
        where.OR = [
            { title: { contains: params.search, mode: 'insensitive' } },
            { destination: { contains: params.search, mode: 'insensitive' } },
            { departure_location: { contains: params.search, mode: 'insensitive' } },
        ];
    }
    if (params.tour_type) {
        where.tour_type = params.tour_type;
    }
    if (params.destination) {
        where.destination = { contains: params.destination, mode: 'insensitive' };
    }
    if (params.departure_location) {
        where.departure_location = { contains: params.departure_location, mode: 'insensitive' };
    }
    if (params.min_price !== undefined || params.max_price !== undefined || params.start_date) {
        where.tour_departures = {
            some: Object.assign(Object.assign(Object.assign({}, (params.min_price !== undefined ? { price: { gte: params.min_price } } : {})), (params.max_price !== undefined ? { price: { lte: params.max_price } } : {})), (params.start_date ? { start_date: { gte: new Date(params.start_date) } } : {})),
        };
    }
    // 1. Phân trang SQL trực tiếp khi không yêu cầu sắp xếp theo giá hay rating
    if (params.sort !== 'price_asc' && params.sort !== 'price_desc' && params.sort !== 'rating_desc' && params.min_rating === undefined) {
        const [total, toursRaw] = yield Promise.all([
            prisma_1.default.tours.count({ where }),
            prisma_1.default.tours.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    tour_images: { orderBy: { sort_order: 'asc' } },
                    tour_departures: {
                        where: { available_seats: { gt: 0 } },
                        orderBy: { start_date: 'asc' },
                    },
                },
            }),
        ]);
        const formatted = yield attachTourMetrics(toursRaw);
        return {
            tours: formatted,
            total,
            page,
            limit,
        };
    }
    // 2. Khi sắp xếp theo giá (price_asc / price_desc):
    // Truy vấn chỉ lấy ID và giá lịch khởi hành gần nhất (nhẹ RAM, không load images/reviews toàn DB)
    if (params.sort === 'price_asc' || params.sort === 'price_desc') {
        const lightweightTours = yield prisma_1.default.tours.findMany({
            where,
            select: {
                id: true,
                created_at: true,
                tour_departures: {
                    where: { available_seats: { gt: 0 } },
                    select: { price: true, discount_price: true },
                    orderBy: { start_date: 'asc' },
                    take: 1,
                },
            },
        });
        // Tính giá hiển thị hiệu dụng của từng tour
        const mapped = lightweightTours.map((t) => {
            var _a;
            const dep = t.tour_departures[0];
            const effectivePrice = dep
                ? Number((_a = dep.discount_price) !== null && _a !== void 0 ? _a : dep.price)
                : (params.sort === 'price_asc' ? Infinity : -Infinity);
            return { id: t.id, price: effectivePrice };
        });
        if (params.sort === 'price_asc') {
            mapped.sort((a, b) => a.price - b.price);
        }
        else {
            mapped.sort((a, b) => b.price - a.price);
        }
        const total = mapped.length;
        const pageItems = mapped.slice(skip, skip + limit);
        const pageIds = pageItems.map((item) => item.id);
        if (pageIds.length === 0) {
            return { tours: [], total, page, limit };
        }
        // Chỉ fetch chi tiết đầy đủ và tính metrics cho duy nhất các tour trong trang hiện tại
        const pageToursRaw = yield prisma_1.default.tours.findMany({
            where: { id: { in: pageIds } },
            include: {
                tour_images: { orderBy: { sort_order: 'asc' } },
                tour_departures: {
                    where: { available_seats: { gt: 0 } },
                    orderBy: { start_date: 'asc' },
                },
            },
        });
        const formatted = yield attachTourMetrics(pageToursRaw);
        // Giữ nguyên thứ tự phân trang đã sắp xếp
        const tourMap = new Map(formatted.map((t) => [t.id, t]));
        const sortedPageTours = pageIds.map((id) => tourMap.get(id)).filter(Boolean);
        return {
            tours: sortedPageTours,
            total,
            page,
            limit,
        };
    }
    const toursRaw = yield prisma_1.default.tours.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: {
                where: { available_seats: { gt: 0 } },
                orderBy: { start_date: 'asc' },
            },
        },
    });
    let formatted = yield attachTourMetrics(toursRaw);
    if (params.min_rating !== undefined) {
        formatted = formatted.filter((t) => t.averageRating >= Number(params.min_rating));
    }
    if (params.sort === 'rating_desc') {
        formatted.sort((a, b) => b.averageRating - a.averageRating);
    }
    const total = formatted.length;
    const paginated = formatted.slice(skip, skip + limit);
    return {
        tours: paginated,
        total,
        page,
        limit,
    };
});
const getFeaturedTours = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 1) {
    const toursRaw = yield prisma_1.default.tours.findMany({
        where: { is_trending: true },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: {
                where: { available_seats: { gt: 0 } },
                orderBy: { start_date: 'asc' },
            },
        },
    });
    if (toursRaw.length === 0) {
        const fallback = yield prisma_1.default.tours.findMany({
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                tour_images: { orderBy: { sort_order: 'asc' } },
                tour_departures: { orderBy: { start_date: 'asc' } },
            },
        });
        return attachTourMetrics(fallback);
    }
    return attachTourMetrics(toursRaw);
});
const getTrendingTours = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 3) {
    const toursRaw = yield prisma_1.default.tours.findMany({
        where: { is_trending: true },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: {
                where: { available_seats: { gt: 0 } },
                orderBy: { start_date: 'asc' },
            },
        },
    });
    return attachTourMetrics(toursRaw);
});
const getPromotionTours = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 3) {
    const toursRaw = yield prisma_1.default.tours.findMany({
        where: {
            tour_departures: {
                some: {
                    discount_price: { not: null },
                    available_seats: { gt: 0 },
                },
            },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: {
                where: {
                    discount_price: { not: null },
                    available_seats: { gt: 0 },
                },
                orderBy: { start_date: 'asc' },
            },
        },
    });
    return attachTourMetrics(toursRaw);
});
const getTopTourReviews = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 3) {
    const reviews = yield prisma_1.default.reviews.findMany({
        where: { item_type: 'tour' },
        take: limit,
        orderBy: [{ rating: 'desc' }, { created_at: 'desc' }],
        include: {
            users: {
                select: {
                    full_name: true,
                    avatar_url: true,
                },
            },
        },
    });
    const tourIds = reviews.map((r) => r.item_id);
    const tours = yield prisma_1.default.tours.findMany({
        where: { id: { in: tourIds } },
        include: {
            tour_images: { take: 1, orderBy: { sort_order: 'asc' } },
        },
    });
    const tourMap = new Map(tours.map((t) => [t.id, t]));
    return reviews.map((r) => {
        const tour = tourMap.get(r.item_id);
        return {
            id: `${r.user_id}_${r.item_id}`,
            rating: r.rating,
            comment: r.comment || '',
            createdAt: r.created_at ? r.created_at.toISOString() : null,
            user: r.users
                ? { fullName: r.users.full_name, avatarUrl: r.users.avatar_url }
                : null,
            tour: tour
                ? {
                    id: tour.id,
                    title: tour.title,
                    destination: tour.destination,
                    images: tour.tour_images.map((i) => i.url),
                }
                : null,
        };
    });
});
const getTourById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const tour = yield prisma_1.default.tours.findUnique({
        where: { id },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: { orderBy: { start_date: 'asc' } },
        },
    });
    if (!tour)
        return null;
    const reviews = yield prisma_1.default.reviews.findMany({
        where: { item_type: 'tour', item_id: id },
        orderBy: { created_at: 'desc' },
        include: {
            users: {
                select: { id: true, full_name: true, avatar_url: true },
            },
        },
    });
    const formatted = yield attachTourMetrics([tour]);
    return Object.assign(Object.assign({}, formatted[0]), { destinations: tour.destinations, foodInclude: tour.food_include, idealTime: tour.ideal_time, vehicle: tour.vehicle, reviews });
});
const getTourDepartures = (tourId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_departures.findMany({
        where: {
            tour_id: tourId,
            available_seats: { gt: 0 },
            start_date: { gte: new Date() },
        },
        orderBy: { start_date: 'asc' },
    });
});
exports.default = {
    getTours,
    getFeaturedTours,
    getTrendingTours,
    getPromotionTours,
    getTopTourReviews,
    getTourById,
    getTourDepartures,
};
//# sourceMappingURL=tours.service.js.map