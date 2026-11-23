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
const flights_service_1 = require("../flights/flights.service");
const handbook_service_1 = require("../handbook/handbook.service");
// (Đã thêm)
const callGeminiIfConfigured = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    var _f;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
        return null;
    try {
        const response = yield fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });
        if (!response.ok)
            return null;
        const data = yield response.json();
        return (_f = (_e = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) !== null && _f !== void 0 ? _f : null;
    }
    catch (_g) {
        return null;
    }
});
/* ============================== SERVICE METHODS ============================== */
const generateItinerary = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const days = Math.max(1, Math.min(30, Number(input.days) || 3));
    const budget = Math.max(0, Number(input.budget) || 10000000);
    const guests = Math.max(1, Number(input.guests) || 2);
    const interestsText = (input.interests || []).join(', ');
    const destinationQuery = (input.destination || '').trim();
    const departureQuery = (input.departure_location || '').trim();
    // 1. Tìm vé máy bay thực tế từ DB
    const depCodes = departureQuery ? (0, flights_service_1.resolveAirportCodes)(departureQuery) : [];
    const arrCodes = destinationQuery ? (0, flights_service_1.resolveAirportCodes)(destinationQuery) : [];
    let matchingFlights = yield prisma_1.default.flights.findMany({
        where: Object.assign(Object.assign({ available_seats: { gte: 1 } }, (depCodes.length > 0
            ? {
                OR: [
                    { departure_airport: { in: depCodes } },
                    { departure_airport: { contains: departureQuery, mode: 'insensitive' } },
                ],
            }
            : {})), (arrCodes.length > 0
            ? {
                OR: [
                    { arrival_airport: { in: arrCodes } },
                    { arrival_airport: { contains: destinationQuery, mode: 'insensitive' } },
                ],
            }
            : {})),
        take: 4,
        include: { planes: true },
        orderBy: { ticket_price: 'asc' },
    });
    // Fallback nếu không có chuyến bay thẳng đúng chặng: tìm các chuyến bay đến điểm đến đó
    if (matchingFlights.length === 0 && arrCodes.length > 0) {
        matchingFlights = yield prisma_1.default.flights.findMany({
            where: {
                available_seats: { gte: 1 },
                OR: [
                    { arrival_airport: { in: arrCodes } },
                    { arrival_airport: { contains: destinationQuery, mode: 'insensitive' } },
                ],
            },
            take: 4,
            include: { planes: true },
            orderBy: { ticket_price: 'asc' },
        });
    }
    // Nếu vẫn chưa có, lấy các chuyến bay tốt nhất hiện có trong hệ thống
    if (matchingFlights.length === 0) {
        matchingFlights = yield prisma_1.default.flights.findMany({
            where: { available_seats: { gte: 1 } },
            take: 4,
            include: { planes: true },
            orderBy: { ticket_price: 'asc' },
        });
    }
    // 2. Tìm Tour du lịch thực tế từ DB
    let matchingTours = yield prisma_1.default.tours.findMany({
        where: destinationQuery
            ? {
                OR: [
                    { destination: { contains: destinationQuery, mode: 'insensitive' } },
                    { title: { contains: destinationQuery, mode: 'insensitive' } },
                    { destinations: { contains: destinationQuery, mode: 'insensitive' } },
                ],
            }
            : {},
        take: 4,
        include: {
            tour_departures: {
                orderBy: { price: 'asc' },
                take: 3,
            },
            tour_images: {
                take: 2,
                orderBy: { sort_order: 'asc' },
            },
        },
    });
    if (matchingTours.length === 0) {
        matchingTours = yield prisma_1.default.tours.findMany({
            take: 4,
            include: {
                tour_departures: {
                    orderBy: { price: 'asc' },
                    take: 3,
                },
                tour_images: {
                    take: 2,
                    orderBy: { sort_order: 'asc' },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    // 3. Tìm Khách sạn / Resort thực tế từ DB
    let matchingHotels = yield prisma_1.default.hotels.findMany({
        where: destinationQuery
            ? {
                OR: [
                    { city: { contains: destinationQuery, mode: 'insensitive' } },
                    { address: { contains: destinationQuery, mode: 'insensitive' } },
                    { name: { contains: destinationQuery, mode: 'insensitive' } },
                ],
            }
            : {},
        take: 4,
        include: {
            hotel_images: {
                take: 2,
                orderBy: { sort_order: 'asc' },
            },
        },
        orderBy: { star_rating: 'desc' },
    });
    if (matchingHotels.length === 0) {
        matchingHotels = yield prisma_1.default.hotels.findMany({
            take: 4,
            include: {
                hotel_images: {
                    take: 2,
                    orderBy: { sort_order: 'asc' },
                },
            },
            orderBy: { star_rating: 'desc' },
        });
    }
    // 4. Tìm Top 4 - 6 bài viết cẩm nang du lịch (Handbook) thực tế từ DB
    let matchingHandbooks = [];
    try {
        if (destinationQuery) {
            const hbSearchRes = yield (0, handbook_service_1.getHandbooks)({ search: destinationQuery, limit: 6 });
            if (hbSearchRes && Array.isArray(hbSearchRes.handbooks) && hbSearchRes.handbooks.length > 0) {
                matchingHandbooks = hbSearchRes.handbooks;
            }
        }
        if (matchingHandbooks.length < 4) {
            const fallbackHbRes = yield (0, handbook_service_1.getHandbooks)({ limit: 6 });
            if (fallbackHbRes && Array.isArray(fallbackHbRes.handbooks)) {
                const existingIds = new Set(matchingHandbooks.map((h) => String(h.id)));
                for (const h of fallbackHbRes.handbooks) {
                    if (!existingIds.has(String(h.id))) {
                        matchingHandbooks.push(h);
                        existingIds.add(String(h.id));
                        if (matchingHandbooks.length >= 6)
                            break;
                    }
                }
            }
        }
    }
    catch (err) {
        console.warn('Lỗi khi lấy dữ liệu handbook cho AI planner:', err);
    }
    // Tạo lời khuyên tóm tắt AI
    const prompt = `Bạn là trợ lý du lịch AI thông minh của Natura Travel. Khách hàng xuất phát từ ${departureQuery || 'Hà Nội'} đi du lịch đến ${destinationQuery || 'Việt Nam'} cho đoàn ${guests} khách với tổng ngân sách ${budget.toLocaleString('vi-VN')} VND, sở thích: ${interestsText || 'tham quan, nghỉ dưỡng'}. Hãy đưa ra lời nhận xét ngắn gọn (khoảng 3-4 câu) gợi ý tối ưu chi phí và trải nghiệm cho chuyến đi.`;
    const aiSummary = yield callGeminiIfConfigured(prompt);
    return {
        input: {
            budget,
            days,
            guests,
            interests: input.interests,
            destination: destinationQuery || 'Điểm đến đề xuất',
            departure_location: departureQuery || 'Điểm xuất phát',
        },
        ai_narrative: aiSummary,
        recommended_flights: matchingFlights,
        recommended_tours: matchingTours,
        recommended_hotels: matchingHotels,
        recommended_handbooks: matchingHandbooks,
    };
});
const compareTours = (input) => __awaiter(void 0, void 0, void 0, function* () {
    if (!input.tour_ids || input.tour_ids.length < 2 || input.tour_ids.length > 4) {
        throw new Error('Vui lòng chọn từ 2 đến 4 tour để so sánh');
    }
    const tours = yield prisma_1.default.tours.findMany({
        where: { id: { in: input.tour_ids } },
        include: {
            tour_departures: { orderBy: { price: 'asc' }, take: 1 },
            tour_images: { take: 1, orderBy: { sort_order: 'asc' } },
        },
    });
    if (tours.length < 2) {
        throw new Error('Không tìm thấy đủ ít nhất 2 tour hợp lệ để so sánh');
    }
    const reviewStats = yield prisma_1.default.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'tour',
            item_id: { in: tours.map((t) => t.id) },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const statsMap = new Map(reviewStats.map((s) => { var _a; return [
        s.item_id,
        {
            avgRating: Number(((_a = s._avg.rating) !== null && _a !== void 0 ? _a : 0).toFixed(1)),
            reviewCount: s._count.rating,
        },
    ]; }));
    const comparisonTable = tours.map((tour) => {
        var _a, _b, _c;
        var _d, _e, _f;
        const dep = (_a = tour.tour_departures) === null || _a === void 0 ? void 0 : _a[0];
        const stat = (_d = statsMap.get(tour.id)) !== null && _d !== void 0 ? _d : { avgRating: 0, reviewCount: 0 };
        const effectivePrice = dep ? Number((_e = dep.discount_price) !== null && _e !== void 0 ? _e : dep.price) : 0;
        return {
            id: tour.id,
            title: tour.title,
            image: (_f = (_c = (_b = tour.tour_images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) !== null && _f !== void 0 ? _f : null,
            tour_type: tour.tour_type,
            destination: tour.destination || 'Đang cập nhật',
            departure_location: tour.departure_location || 'Đang cập nhật',
            duration: tour.duration || 'Đang cập nhật',
            price: dep ? Number(dep.price) : 0,
            effective_price: effectivePrice,
            vehicle: tour.vehicle || 'Đang cập nhật',
            food_include: tour.food_include || 'Đang cập nhật',
            ideal_time: tour.ideal_time || 'Quanh năm',
            destinations_detail: tour.destinations || '',
            average_rating: stat.avgRating,
            review_count: stat.reviewCount,
        };
    });
    // Chọn tour gợi ý tốt nhất theo tiêu chí
    let bestTour = comparisonTable[0];
    if (input.priority === 'rating') {
        bestTour = [...comparisonTable].sort((a, b) => b.average_rating - a.average_rating)[0];
    }
    else {
        bestTour = [...comparisonTable].sort((a, b) => a.effective_price - b.effective_price)[0];
    }
    const prompt = `So sánh ngắn gọn các tour sau và đưa ra lời khuyên chọn tour: ${JSON.stringify(comparisonTable.map((t) => ({
        title: t.title,
        price: t.effective_price,
        duration: t.duration,
        rating: t.average_rating,
        vehicle: t.vehicle,
    })))}`;
    const aiVerdict = yield callGeminiIfConfigured(prompt);
    return {
        comparison_table: comparisonTable,
        best_recommendation: {
            tour_id: bestTour.id,
            title: bestTour.title,
            reason: aiVerdict ||
                `Gợi ý phù hợp nhất dựa trên tiêu chí ${input.priority === 'rating' ? 'đánh giá cao nhất' : 'mức giá tối ưu nhất'}.`,
        },
    };
});
exports.default = {
    generateItinerary,
    compareTours,
};
//# sourceMappingURL=ai.service.js.map