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
    const budget = Math.max(0, Number(input.budget) || 5000000);
    const interestsText = (input.interests || []).join(', ');
    // Tìm các tour và khách sạn phù hợp trong database làm gợi ý thực tế
    const [matchingTours, matchingHotels] = yield Promise.all([
        prisma_1.default.tours.findMany({
            where: input.destination
                ? {
                    OR: [
                        { destination: { contains: input.destination, mode: 'insensitive' } },
                        { title: { contains: input.destination, mode: 'insensitive' } },
                    ],
                }
                : {},
            take: 3,
            include: {
                tour_departures: {
                    where: { price: { lte: budget } },
                    orderBy: { price: 'asc' },
                    take: 1,
                },
                tour_images: { take: 1 },
            },
        }),
        prisma_1.default.hotels.findMany({
            where: Object.assign({ price_per_night: { lte: Math.round(budget / days) } }, (input.destination
                ? { city: { contains: input.destination, mode: 'insensitive' } }
                : {})),
            take: 3,
            include: { hotel_images: { take: 1 } },
        }),
    ]);
    const prompt = `Bạn là trợ lý du lịch thông minh của Natura Travel. Hãy lập lịch trình du lịch ${days} ngày đến ${input.destination || 'điểm đến phù hợp tại Việt Nam'} với ngân sách ${budget.toLocaleString('vi-VN')} VND, sở thích: ${interestsText || 'tham quan, ẩm thực'}. Trả lời ngắn gọn theo từng ngày.`;
    const aiSummary = yield callGeminiIfConfigured(prompt);
    const dailyPlan = Array.from({ length: days }, (_, idx) => ({
        day: idx + 1,
        title: `Ngày ${idx + 1}: Khám phá ${input.destination || 'điểm đến'}`,
        activities: [
            idx === 0
                ? 'Di chuyển, nhận phòng khách sạn và dạo quanh khu vực trung tâm.'
                : `Tham quan các điểm nổi bật theo sở thích (${interestsText || 'trải nghiệm địa phương'}).`,
            'Thưởng thức ẩm thực đặc sản địa phương.',
            idx === days - 1 ? 'Mua sắm quà lưu niệm và làm thủ tục trả phòng.' : 'Nghỉ ngơi tại khách sạn.',
        ],
        estimated_cost: Math.round(budget / days),
    }));
    return {
        input: {
            budget,
            days,
            interests: input.interests,
            destination: input.destination || 'Tự động gợi ý',
        },
        ai_narrative: aiSummary,
        daily_plan: dailyPlan,
        recommended_tours: matchingTours,
        recommended_hotels: matchingHotels,
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