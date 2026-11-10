import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface HotelFilterParams {
    page: number;
    limit: number;
    search?: string;
    city?: string;
    star_rating?: number;
    min_price?: number;
    max_price?: number;
    amenities?: string[];
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | 'star_desc';
}

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

// (Đã thêm)
const attachHotelMetrics = async (hotels: any[]) => {
    if (hotels.length === 0) return [];
    const hotelIds = hotels.map((h) => h.id);

    const reviewStats = await prisma.reviews.groupBy({
        by: ['item_id'],
        where: {
            item_type: 'hotel',
            item_id: { in: hotelIds },
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

    return hotels.map((hotel) => {
        const stat = statsMap.get(hotel.id) ?? { averageRating: 0, reviewCount: 0 };
        return {
            ...hotel,
            price_per_night: Number(hotel.price_per_night),
            discount_price: hotel.discount_price ? Number(hotel.discount_price) : null,
            images: (hotel.hotel_images ?? []).map((img: any) => img.url),
            averageRating: stat.averageRating,
            reviewCount: stat.reviewCount,
        };
    });
};

/* ============================== SERVICE METHODS ============================== */

const getHotels = async (params: HotelFilterParams) => {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where: any = {};

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
        where.price_per_night = {
            ...(params.min_price !== undefined ? { gte: params.min_price } : {}),
            ...(params.max_price !== undefined ? { lte: params.max_price } : {}),
        };
    }
    if (params.amenities && params.amenities.length > 0) {
        where.amenities = { hasEvery: params.amenities };
    }

    const hotelsRaw = await prisma.hotels.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });

    let formatted = await attachHotelMetrics(hotelsRaw);

    if (params.sort === 'price_asc') {
        formatted.sort((a, b) => (a.discount_price ?? a.price_per_night) - (b.discount_price ?? b.price_per_night));
    } else if (params.sort === 'price_desc') {
        formatted.sort((a, b) => (b.discount_price ?? b.price_per_night) - (a.discount_price ?? a.price_per_night));
    } else if (params.sort === 'star_desc') {
        formatted.sort((a, b) => (b.star_rating ?? 0) - (a.star_rating ?? 0));
    } else if (params.sort === 'rating_desc') {
        formatted.sort((a, b) => b.averageRating - a.averageRating);
    }

    const total = formatted.length;
    const hotels = formatted.slice(skip, skip + limit);

    return { hotels, total, page, limit };
};

const getTrendingHotels = async (limit: number = 6) => {
    const hotelsRaw = await prisma.hotels.findMany({
        where: { is_trending: true },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });

    return attachHotelMetrics(hotelsRaw);
};

const getTopHotels = async (limit: number = 6) => {
    const hotelsRaw = await prisma.hotels.findMany({
        orderBy: { star_rating: 'desc' },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });

    const formatted = await attachHotelMetrics(hotelsRaw);
    formatted.sort((a, b) => b.averageRating - a.averageRating);
    return formatted.slice(0, limit);
};

const getHotelById = async (id: string) => {
    const hotel = await prisma.hotels.findUnique({
        where: { id },
        include: {
            hotel_images: { orderBy: { sort_order: 'asc' } },
        },
    });

    if (!hotel) return null;

    const reviews = await prisma.reviews.findMany({
        where: { item_type: 'hotel', item_id: id },
        orderBy: { created_at: 'desc' },
        include: {
            users: {
                select: { id: true, full_name: true, avatar_url: true },
            },
        },
    });

    const formatted = await attachHotelMetrics([hotel]);
    return {
        ...formatted[0],
        reviews,
    };
};

const checkRoomAvailability = async (id: string, roomsNeeded: number = 1, checkIn?: string, checkOut?: string) => {
    const hotel = await prisma.hotels.findUnique({ where: { id } });
    if (!hotel) return null;

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
};

export default {
    getHotels,
    getTrendingHotels,
    getTopHotels,
    getHotelById,
    checkRoomAvailability,
};

