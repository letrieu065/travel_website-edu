import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface TourFilterParams {
    page: number;
    limit: number;
    search?: string;
    tour_type?: string;
    destination?: string;
    departure_location?: string;
    min_price?: number;
    max_price?: number;
    start_date?: string;
    min_rating?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc';
}

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// (Đã thêm)
const attachTourMetrics = async (tours: any[]) => {
    if (tours.length === 0) return [];
    const tourIds = tours.map((t) => t.id);

    const reviewStats = await prisma.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'tour',
            item_id: { in: tourIds },
        },
        _avg: { rating: true },
        _count: { rating: true },
    });

    const statsMap = new Map(
        reviewStats.map((s) => [
            s.item_id,
            {
                averageRating: Number((s._avg.rating ?? 0).toFixed(1)),
                reviewCount: s._count.rating,
            },
        ])
    );

    return tours.map((tour) => {
        const nextDeparture = tour.tour_departures?.[0];
        const stat = statsMap.get(tour.id) ?? { averageRating: 0, reviewCount: 0 };

        return {
            id: tour.id,
            title: tour.title,
            description: tour.description,
            tourType: tour.tour_type,
            price: nextDeparture ? Number(nextDeparture.price) : 0,
            discountPrice: nextDeparture?.discount_price ? Number(nextDeparture.discount_price) : null,
            duration: tour.duration,
            destination: tour.destination,
            departureLocation: tour.departure_location,
            startDate: nextDeparture?.start_date ? nextDeparture.start_date.toISOString() : '',
            availableSeats: nextDeparture?.available_seats ?? 0,
            images: (tour.tour_images ?? []).map((img: any) => img.url),
            isTrending: tour.is_trending,
            averageRating: stat.averageRating,
            reviewCount: stat.reviewCount,
            departures: tour.tour_departures ?? [],
        };
    });
};

/* ============================== SERVICE METHODS ============================== */

const getTours = async (params: TourFilterParams) => {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where: any = {};

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
            some: {
                ...(params.min_price !== undefined ? { price: { gte: params.min_price } } : {}),
                ...(params.max_price !== undefined ? { price: { lte: params.max_price } } : {}),
                ...(params.start_date ? { start_date: { gte: new Date(params.start_date) } } : {}),
            },
        };
    }

    const toursRaw = await prisma.tours.findMany({
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

    let formatted = await attachTourMetrics(toursRaw);

    if (params.min_rating !== undefined) {
        formatted = formatted.filter((t) => t.averageRating >= Number(params.min_rating));
    }

    if (params.sort === 'price_asc') {
        formatted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (params.sort === 'price_desc') {
        formatted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    } else if (params.sort === 'rating_desc') {
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
};

const getFeaturedTours = async (limit: number = 1) => {
    const toursRaw = await prisma.tours.findMany({
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
        const fallback = await prisma.tours.findMany({
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
};

const getTrendingTours = async (limit: number = 3) => {
    const toursRaw = await prisma.tours.findMany({
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
};

const getPromotionTours = async (limit: number = 3) => {
    const toursRaw = await prisma.tours.findMany({
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
};

const getTopTourReviews = async (limit: number = 3) => {
    const reviews = await prisma.reviews.findMany({
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
    const tours = await prisma.tours.findMany({
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
};

const getTourById = async (id: string) => {
    const tour = await prisma.tours.findUnique({
        where: { id },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: { orderBy: { start_date: 'asc' } },
        },
    });

    if (!tour) return null;

    const reviews = await prisma.reviews.findMany({
        where: { item_type: 'tour', item_id: id },
        orderBy: { created_at: 'desc' },
        include: {
            users: {
                select: { id: true, full_name: true, avatar_url: true },
            },
        },
    });

    const formatted = await attachTourMetrics([tour]);

    return {
        ...formatted[0],
        destinations: tour.destinations,
        foodInclude: tour.food_include,
        idealTime: tour.ideal_time,
        vehicle: tour.vehicle,
        reviews,
    };
};

const getTourDepartures = async (tourId: string) => {
    return prisma.tour_departures.findMany({
        where: {
            tour_id: tourId,
            available_seats: { gt: 0 },
            start_date: { gte: new Date() },
        },
        orderBy: { start_date: 'asc' },
    });
};

export default {
    getTours,
    getFeaturedTours,
    getTrendingTours,
    getPromotionTours,
    getTopTourReviews,
    getTourById,
    getTourDepartures,
};

