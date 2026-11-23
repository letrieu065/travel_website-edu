import prisma from '../../config/prisma';
import { resolveAirportCodes } from '../flights/flights.service';
import { getHandbooks } from '../handbook/handbook.service';

/* ============================== TYPES ============================== */

export interface GenerateItineraryInput {
    budget: number;
    days: number;
    interests: string[];
    destination?: string;
    departure_location?: string;
    guests?: number;
}

export interface CompareToursInput {
    tour_ids: string[];
    priority?: 'budget' | 'rating' | 'duration';
}

// (Đã thêm)
const callGeminiIfConfigured = async (prompt: string): Promise<string | null> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );
        if (!response.ok) return null;
        const data: any = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
        return null;
    }
};

/* ============================== SERVICE METHODS ============================== */

const generateItinerary = async (input: GenerateItineraryInput) => {
    const days = Math.max(1, Math.min(30, Number(input.days) || 3));
    const budget = Math.max(0, Number(input.budget) || 10000000);
    const guests = Math.max(1, Number(input.guests) || 2);
    const interestsText = (input.interests || []).join(', ');
    const destinationQuery = (input.destination || '').trim();
    const departureQuery = (input.departure_location || '').trim();

    // 1. Tìm vé máy bay thực tế từ DB
    const depCodes = departureQuery ? resolveAirportCodes(departureQuery) : [];
    const arrCodes = destinationQuery ? resolveAirportCodes(destinationQuery) : [];

    let matchingFlights = await prisma.flights.findMany({
        where: {
            available_seats: { gte: 1 },
            ...(depCodes.length > 0
                ? {
                      OR: [
                          { departure_airport: { in: depCodes } },
                          { departure_airport: { contains: departureQuery, mode: 'insensitive' } },
                      ],
                  }
                : {}),
            ...(arrCodes.length > 0
                ? {
                      OR: [
                          { arrival_airport: { in: arrCodes } },
                          { arrival_airport: { contains: destinationQuery, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        },
        take: 4,
        include: { planes: true },
        orderBy: { ticket_price: 'asc' },
    });

    // Fallback nếu không có chuyến bay thẳng đúng chặng: tìm các chuyến bay đến điểm đến đó
    if (matchingFlights.length === 0 && arrCodes.length > 0) {
        matchingFlights = await prisma.flights.findMany({
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
        matchingFlights = await prisma.flights.findMany({
            where: { available_seats: { gte: 1 } },
            take: 4,
            include: { planes: true },
            orderBy: { ticket_price: 'asc' },
        });
    }

    // 2. Tìm Tour du lịch thực tế từ DB
    let matchingTours = await prisma.tours.findMany({
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
        matchingTours = await prisma.tours.findMany({
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
    let matchingHotels = await prisma.hotels.findMany({
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
        matchingHotels = await prisma.hotels.findMany({
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
    let matchingHandbooks: any[] = [];
    try {
        if (destinationQuery) {
            const hbSearchRes = await getHandbooks({ search: destinationQuery, limit: 6 });
            if (hbSearchRes && Array.isArray(hbSearchRes.handbooks) && hbSearchRes.handbooks.length > 0) {
                matchingHandbooks = hbSearchRes.handbooks;
            }
        }
        if (matchingHandbooks.length < 4) {
            const fallbackHbRes = await getHandbooks({ limit: 6 });
            if (fallbackHbRes && Array.isArray(fallbackHbRes.handbooks)) {
                const existingIds = new Set(matchingHandbooks.map((h: any) => String(h.id)));
                for (const h of fallbackHbRes.handbooks) {
                    if (!existingIds.has(String(h.id))) {
                        matchingHandbooks.push(h);
                        existingIds.add(String(h.id));
                        if (matchingHandbooks.length >= 6) break;
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Lỗi khi lấy dữ liệu handbook cho AI planner:', err);
    }

    // Tạo lời khuyên tóm tắt AI
    const prompt = `Bạn là trợ lý du lịch AI thông minh của Natura Travel. Khách hàng xuất phát từ ${
        departureQuery || 'Hà Nội'
    } đi du lịch đến ${
        destinationQuery || 'Việt Nam'
    } cho đoàn ${guests} khách với tổng ngân sách ${budget.toLocaleString('vi-VN')} VND, sở thích: ${
        interestsText || 'tham quan, nghỉ dưỡng'
    }. Hãy đưa ra lời nhận xét ngắn gọn (khoảng 3-4 câu) gợi ý tối ưu chi phí và trải nghiệm cho chuyến đi.`;

    const aiSummary = await callGeminiIfConfigured(prompt);

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
};

const compareTours = async (input: CompareToursInput) => {
    if (!input.tour_ids || input.tour_ids.length < 2 || input.tour_ids.length > 4) {
        throw new Error('Vui lòng chọn từ 2 đến 4 tour để so sánh');
    }

    const tours = await prisma.tours.findMany({
        where: { id: { in: input.tour_ids } },
        include: {
            tour_departures: { orderBy: { price: 'asc' }, take: 1 },
            tour_images: { take: 1, orderBy: { sort_order: 'asc' } },
        },
    });

    if (tours.length < 2) {
        throw new Error('Không tìm thấy đủ ít nhất 2 tour hợp lệ để so sánh');
    }

    const reviewStats = await prisma.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'tour',
            item_id: { in: tours.map((t) => t.id) },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });

    const statsMap = new Map(
        reviewStats.map((s) => [
            s.item_id,
            {
                avgRating: Number((s._avg.rating ?? 0).toFixed(1)),
                reviewCount: s._count.rating,
            },
        ])
    );

    const comparisonTable = tours.map((tour) => {
        const dep = tour.tour_departures?.[0];
        const stat = statsMap.get(tour.id) ?? { avgRating: 0, reviewCount: 0 };
        const effectivePrice = dep ? Number(dep.discount_price ?? dep.price) : 0;

        return {
            id: tour.id,
            title: tour.title,
            image: tour.tour_images?.[0]?.url ?? null,
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
    } else {
        bestTour = [...comparisonTable].sort((a, b) => a.effective_price - b.effective_price)[0];
    }

    const prompt = `So sánh ngắn gọn các tour sau và đưa ra lời khuyên chọn tour: ${JSON.stringify(
        comparisonTable.map((t) => ({
            title: t.title,
            price: t.effective_price,
            duration: t.duration,
            rating: t.average_rating,
            vehicle: t.vehicle,
        }))
    )}`;
    const aiVerdict = await callGeminiIfConfigured(prompt);

    return {
        comparison_table: comparisonTable,
        best_recommendation: {
            tour_id: bestTour.id,
            title: bestTour.title,
            reason:
                aiVerdict ||
                `Gợi ý phù hợp nhất dựa trên tiêu chí ${
                    input.priority === 'rating' ? 'đánh giá cao nhất' : 'mức giá tối ưu nhất'
                }.`,
        },
    };
};

export default {
    generateItinerary,
    compareTours,
};

