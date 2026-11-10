import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface GenerateItineraryInput {
    budget: number;
    days: number;
    interests: string[];
    destination?: string;
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
    const budget = Math.max(0, Number(input.budget) || 5000000);
    const interestsText = (input.interests || []).join(', ');

    // Tìm các tour và khách sạn phù hợp trong database làm gợi ý thực tế
    const [matchingTours, matchingHotels] = await Promise.all([
        prisma.tours.findMany({
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
        prisma.hotels.findMany({
            where: {
                price_per_night: { lte: Math.round(budget / days) },
                ...(input.destination
                    ? { city: { contains: input.destination, mode: 'insensitive' } }
                    : {}),
            },
            take: 3,
            include: { hotel_images: { take: 1 } },
        }),
    ]);

    const prompt = `Bạn là trợ lý du lịch thông minh của Natura Travel. Hãy lập lịch trình du lịch ${days} ngày đến ${
        input.destination || 'điểm đến phù hợp tại Việt Nam'
    } với ngân sách ${budget.toLocaleString('vi-VN')} VND, sở thích: ${
        interestsText || 'tham quan, ẩm thực'
    }. Trả lời ngắn gọn theo từng ngày.`;

    const aiSummary = await callGeminiIfConfigured(prompt);

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

