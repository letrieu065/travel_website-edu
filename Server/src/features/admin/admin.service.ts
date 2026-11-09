import prisma from '../../config/prisma';
import bcrypt from 'bcrypt';

/* ============================== TYPES ============================== */

export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

export interface UserData {
    email: string;
    password?: string;
    full_name: string;
    phone_number?: string;
    avatar_url?: string;
    role?: 'user' | 'admin';
}

export interface TourData {
    title: string;
    description?: string;
    tour_type: string;
    duration?: string;
    departure_location?: string;
    destination?: string;
    destinations?: string;
    food_include?: string;
    ideal_time?: string;
    vehicle?: string;
    is_trending?: boolean;
}

export interface TourDepartureData {
    start_date: string; // ISO date
    price: number;
    discount_price?: number;
    available_seats: number;
}

export interface HotelData {
    name: string;
    description?: string;
    city: string;
    address: string;
    star_rating?: number;
    price_per_night: number;
    discount_price?: number;
    amenities?: string[];
    available_rooms: number;
    is_trending?: boolean;
}

export interface PlaneData {
    airline: string;
    plane_number: string;
    total_seats: number;
}

export interface FlightData {
    plane_id: string;
    departure_time: string; // ISO datetime
    arrival_time: string;   // ISO datetime
    ticket_price: number;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
}

export interface ImageData {
    url: string;
    sort_order?: number;
}

export type ItemType = 'tour' | 'flight' | 'hotel';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// (Đã thêm)
const getPagination = (params: PaginationParams) => {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/* ============================== USERS ============================== */

const getUsers = async (params: PaginationParams & { role?: string; auth_provider?: string }): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.search) {
        where.OR = [
            { email: { contains: params.search, mode: 'insensitive' } },
            { full_name: { contains: params.search, mode: 'insensitive' } },
            { phone_number: { contains: params.search, mode: 'insensitive' } },
        ];
    }
    if (params.role) {
        where.role = params.role;
    }
    if (params.auth_provider) {
        where.auth_provider = params.auth_provider;
    }

    const [total, items] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                email: true,
                full_name: true,
                phone_number: true,
                avatar_url: true,
                auth_provider: true,
                role: true,
                created_at: true,
                _count: {
                    select: {
                        bookings: true,
                        reviews: true,
                    },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getUserById = async (id: string) => {
    return prisma.users.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            auth_provider: true,
            role: true,
            created_at: true,
            bookings: {
                take: 10,
                orderBy: { created_at: 'desc' },
                include: {
                    booking_items: true,
                    payments: true,
                },
            },
            reviews: {
                take: 10,
                orderBy: { created_at: 'desc' },
            },
        },
    });
};

const createUser = async (data: UserData) => {
    const existing = await prisma.users.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new Error('Email đã được sử dụng');
    }

    let password_hash: string | undefined;
    if (data.password) {
        password_hash = await bcrypt.hash(data.password, 10);
    }

    return prisma.users.create({
        data: {
            email: data.email,
            password_hash,
            full_name: data.full_name,
            phone_number: data.phone_number,
            avatar_url: data.avatar_url,
            role: data.role || 'user',
            auth_provider: 'local',
        },
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            role: true,
            created_at: true,
        },
    });
};

const updateUser = async (id: string, data: Partial<UserData>) => {
    const updateData: any = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;

    if (data.password) {
        updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    return prisma.users.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            full_name: true,
            phone_number: true,
            avatar_url: true,
            role: true,
            created_at: true,
        },
    });
};

const updateUserRole = async (id: string, role: 'user' | 'admin') => {
    return prisma.users.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
        },
    });
};

const deleteUser = async (id: string) => {
    return prisma.users.delete({
        where: { id },
    });
};

/* ============================== TOURS ============================== */

const getTours = async (params: PaginationParams & { tour_type?: string; is_trending?: boolean }): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
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
    if (params.is_trending !== undefined) {
        where.is_trending = params.is_trending;
    }

    const [total, items] = await Promise.all([
        prisma.tours.count({ where }),
        prisma.tours.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                tour_images: {
                    orderBy: { sort_order: 'asc' },
                },
                tour_departures: {
                    orderBy: { start_date: 'asc' },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getTourById = async (id: string) => {
    return prisma.tours.findUnique({
        where: { id },
        include: {
            tour_images: {
                orderBy: { sort_order: 'asc' },
            },
            tour_departures: {
                orderBy: { start_date: 'asc' },
            },
        },
    });
};

const createTour = async (data: TourData) => {
    return prisma.tours.create({
        data: {
            title: data.title,
            description: data.description,
            tour_type: data.tour_type,
            duration: data.duration,
            departure_location: data.departure_location,
            destination: data.destination,
            destinations: data.destinations,
            food_include: data.food_include,
            ideal_time: data.ideal_time,
            vehicle: data.vehicle,
            is_trending: data.is_trending ?? false,
        },
    });
};

const updateTour = async (id: string, data: Partial<TourData>) => {
    return prisma.tours.update({
        where: { id },
        data,
    });
};

const deleteTour = async (id: string) => {
    return prisma.tours.delete({
        where: { id },
    });
};

const setTourTrending = async (id: string, is_trending: boolean) => {
    return prisma.tours.update({
        where: { id },
        data: { is_trending },
    });
};

// Tour departures
const getTourDepartures = async (tourId: string) => {
    return prisma.tour_departures.findMany({
        where: { tour_id: tourId },
        orderBy: { start_date: 'asc' },
    });
};

const createTourDeparture = async (tourId: string, data: TourDepartureData) => {
    return prisma.tour_departures.create({
        data: {
            tour_id: tourId,
            start_date: new Date(data.start_date),
            price: data.price,
            discount_price: data.discount_price,
            available_seats: data.available_seats,
        },
    });
};

const updateTourDeparture = async (departureId: string, data: Partial<TourDepartureData>) => {
    const updateData: any = {};
    if (data.start_date) updateData.start_date = new Date(data.start_date);
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discount_price !== undefined) updateData.discount_price = data.discount_price;
    if (data.available_seats !== undefined) updateData.available_seats = data.available_seats;

    return prisma.tour_departures.update({
        where: { id: departureId },
        data: updateData,
    });
};

const deleteTourDeparture = async (departureId: string) => {
    return prisma.tour_departures.delete({
        where: { id: departureId },
    });
};

// Tour images
const addTourImages = async (tourId: string, images: ImageData[]) => {
    return prisma.tour_images.createMany({
        data: images.map((img) => ({
            tour_id: tourId,
            url: img.url,
            sort_order: img.sort_order ?? 0,
        })),
    });
};

const updateTourImageOrder = async (tourId: string, orders: { id: string; sort_order: number }[]) => {
    return prisma.$transaction(
        orders.map((order) =>
            prisma.tour_images.update({
                where: { id: order.id },
                data: { sort_order: order.sort_order },
            })
        )
    );
};

const deleteTourImage = async (imageId: string) => {
    return prisma.tour_images.delete({
        where: { id: imageId },
    });
};

/* ============================== HOTELS ============================== */

const getHotels = async (params: PaginationParams & { city?: string; star_rating?: number; is_trending?: boolean }): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
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
    if (params.is_trending !== undefined) {
        where.is_trending = params.is_trending;
    }

    const [total, items] = await Promise.all([
        prisma.hotels.count({ where }),
        prisma.hotels.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                hotel_images: {
                    orderBy: { sort_order: 'asc' },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getHotelById = async (id: string) => {
    return prisma.hotels.findUnique({
        where: { id },
        include: {
            hotel_images: {
                orderBy: { sort_order: 'asc' },
            },
        },
    });
};

const createHotel = async (data: HotelData) => {
    return prisma.hotels.create({
        data: {
            name: data.name,
            description: data.description,
            city: data.city,
            address: data.address,
            star_rating: data.star_rating,
            price_per_night: data.price_per_night,
            discount_price: data.discount_price,
            amenities: data.amenities ?? [],
            available_rooms: data.available_rooms,
            is_trending: data.is_trending ?? false,
        },
    });
};

const updateHotel = async (id: string, data: Partial<HotelData>) => {
    return prisma.hotels.update({
        where: { id },
        data,
    });
};

const deleteHotel = async (id: string) => {
    return prisma.hotels.delete({
        where: { id },
    });
};

const setHotelTrending = async (id: string, is_trending: boolean) => {
    return prisma.hotels.update({
        where: { id },
        data: { is_trending },
    });
};

// Hotel images
const addHotelImages = async (hotelId: string, images: ImageData[]) => {
    return prisma.hotel_images.createMany({
        data: images.map((img) => ({
            hotel_id: hotelId,
            url: img.url,
            sort_order: img.sort_order ?? 0,
        })),
    });
};

const updateHotelImageOrder = async (hotelId: string, orders: { id: string; sort_order: number }[]) => {
    return prisma.$transaction(
        orders.map((order) =>
            prisma.hotel_images.update({
                where: { id: order.id },
                data: { sort_order: order.sort_order },
            })
        )
    );
};

const deleteHotelImage = async (imageId: string) => {
    return prisma.hotel_images.delete({
        where: { id: imageId },
    });
};

/* ============================== PLANES ============================== */

const getPlanes = async (params: PaginationParams): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.search) {
        where.OR = [
            { airline: { contains: params.search, mode: 'insensitive' } },
            { plane_number: { contains: params.search, mode: 'insensitive' } },
        ];
    }

    const [total, items] = await Promise.all([
        prisma.planes.count({ where }),
        prisma.planes.findMany({
            where,
            skip,
            take: limit,
            orderBy: { airline: 'asc' },
            include: {
                _count: {
                    select: { flights: true },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getPlaneById = async (id: string) => {
    return prisma.planes.findUnique({
        where: { id },
        include: {
            flights: {
                orderBy: { departure_time: 'desc' },
                take: 10,
            },
        },
    });
};

const createPlane = async (data: PlaneData) => {
    return prisma.planes.create({
        data: {
            airline: data.airline,
            plane_number: data.plane_number,
            total_seats: data.total_seats,
        },
    });
};

const updatePlane = async (id: string, data: Partial<PlaneData>) => {
    return prisma.planes.update({
        where: { id },
        data,
    });
};

const deletePlane = async (id: string) => {
    return prisma.planes.delete({
        where: { id },
    });
};

/* ============================== FLIGHTS ============================== */

const getFlights = async (
    params: PaginationParams & { departure_airport?: string; arrival_airport?: string; from_date?: string; to_date?: string }
): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.departure_airport) {
        where.departure_airport = { contains: params.departure_airport, mode: 'insensitive' };
    }
    if (params.arrival_airport) {
        where.arrival_airport = { contains: params.arrival_airport, mode: 'insensitive' };
    }
    if (params.from_date || params.to_date) {
        where.departure_time = {
            ...(params.from_date ? { gte: new Date(params.from_date) } : {}),
            ...(params.to_date ? { lte: new Date(params.to_date) } : {}),
        };
    }

    const [total, items] = await Promise.all([
        prisma.flights.count({ where }),
        prisma.flights.findMany({
            where,
            skip,
            take: limit,
            orderBy: { departure_time: 'asc' },
            include: {
                planes: true,
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getFlightById = async (id: string) => {
    return prisma.flights.findUnique({
        where: { id },
        include: {
            planes: true,
        },
    });
};

const createFlight = async (data: FlightData) => {
    return prisma.flights.create({
        data: {
            plane_id: data.plane_id,
            departure_time: new Date(data.departure_time),
            arrival_time: new Date(data.arrival_time),
            ticket_price: data.ticket_price,
            available_seats: data.available_seats,
            departure_airport: data.departure_airport,
            arrival_airport: data.arrival_airport,
        },
        include: {
            planes: true,
        },
    });
};

const updateFlight = async (id: string, data: Partial<FlightData>) => {
    const updateData: any = { ...data };
    if (data.departure_time) updateData.departure_time = new Date(data.departure_time);
    if (data.arrival_time) updateData.arrival_time = new Date(data.arrival_time);

    return prisma.flights.update({
        where: { id },
        data: updateData,
        include: {
            planes: true,
        },
    });
};

const deleteFlight = async (id: string) => {
    return prisma.flights.delete({
        where: { id },
    });
};

/* ============================== BOOKINGS ============================== */

const getBookings = async (
    params: PaginationParams & { user_id?: string; from_date?: string; to_date?: string }
): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.user_id) {
        where.user_id = params.user_id;
    }
    if (params.from_date || params.to_date) {
        where.created_at = {
            ...(params.from_date ? { gte: new Date(params.from_date) } : {}),
            ...(params.to_date ? { lte: new Date(params.to_date) } : {}),
        };
    }

    const [total, items] = await Promise.all([
        prisma.bookings.count({ where }),
        prisma.bookings.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                booking_items: true,
                payments: true,
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getBookingById = async (id: string) => {
    return prisma.bookings.findUnique({
        where: { id },
        include: {
            users: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone_number: true,
                },
            },
            booking_items: true,
            payments: true,
        },
    });
};

const getBookingsByUser = async (userId: string, params: PaginationParams): Promise<PaginatedResult<any>> => {
    return getBookings({ ...params, user_id: userId });
};

const deleteBooking = async (id: string) => {
    return prisma.bookings.delete({
        where: { id },
    });
};

/* ============================== PAYMENTS ============================== */

const getPayments = async (
    params: PaginationParams & { payment_status?: PaymentStatus; payment_method?: string; from_date?: string; to_date?: string }
): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.payment_status) {
        where.payment_status = params.payment_status;
    }
    if (params.payment_method) {
        where.payment_method = { contains: params.payment_method, mode: 'insensitive' };
    }
    if (params.from_date || params.to_date) {
        where.payment_date = {
            ...(params.from_date ? { gte: new Date(params.from_date) } : {}),
            ...(params.to_date ? { lte: new Date(params.to_date) } : {}),
        };
    }

    const [total, items] = await Promise.all([
        prisma.payments.count({ where }),
        prisma.payments.findMany({
            where,
            skip,
            take: limit,
            orderBy: { payment_date: 'desc' },
            include: {
                bookings: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const getPaymentById = async (id: string) => {
    return prisma.payments.findUnique({
        where: { id },
        include: {
            bookings: {
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            phone_number: true,
                        },
                    },
                    booking_items: true,
                },
            },
        },
    });
};

const getPaymentsByBooking = async (bookingId: string) => {
    return prisma.payments.findMany({
        where: { booking_id: bookingId },
        orderBy: { payment_date: 'desc' },
    });
};

const updatePaymentStatus = async (id: string, payment_status: PaymentStatus) => {
    return prisma.payments.update({
        where: { id },
        data: {
            payment_status,
            payment_date: payment_status === 'paid' ? new Date() : undefined,
        },
    });
};

/* ============================== REVIEWS ============================== */

const getReviews = async (
    params: PaginationParams & { item_type?: ItemType; item_id?: string; rating?: number }
): Promise<PaginatedResult<any>> => {
    const { page, limit, skip } = getPagination(params);
    const where: any = {};

    if (params.item_type) {
        where.item_type = params.item_type;
    }
    if (params.item_id) {
        where.item_id = params.item_id;
    }
    if (params.rating !== undefined) {
        where.rating = Number(params.rating);
    }

    const [total, items] = await Promise.all([
        prisma.reviews.count({ where }),
        prisma.reviews.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
            },
        }),
    ]);

    return { items, total, page, limit };
};

const deleteReview = async (userId: string, itemId: string, itemType: ItemType) => {
    return prisma.reviews.delete({
        where: {
            user_id_item_id_item_type: {
                user_id: userId,
                item_id: itemId,
                item_type: itemType,
            },
        },
    });
};

/* ============================== DASHBOARD ============================== */

const getDashboardStats = async () => {
    const [totalUsers, totalBookings, totalTours, totalHotels, totalFlights, paidPayments, recentBookings, recentUsers] =
        await Promise.all([
            prisma.users.count(),
            prisma.bookings.count(),
            prisma.tours.count(),
            prisma.hotels.count(),
            prisma.flights.count(),
            prisma.payments.aggregate({
                where: { payment_status: 'paid' },
                _sum: { amount: true },
            }),
            prisma.bookings.findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                        },
                    },
                    payments: true,
                },
            }),
            prisma.users.findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    created_at: true,
                },
            }),
        ]);

    return {
        totalUsers,
        totalBookings,
        totalTours,
        totalHotels,
        totalFlights,
        totalRevenue: Number(paidPayments._sum.amount ?? 0),
        recentBookings,
        recentUsers,
    };
};

const getRevenueStats = async (params: { from_date: string; to_date: string; group_by: 'day' | 'month' | 'year' }) => {
    const from = new Date(params.from_date);
    const to = new Date(params.to_date);

    const payments = await prisma.payments.findMany({
        where: {
            payment_status: 'paid',
            payment_date: {
                gte: from,
                lte: to,
            },
        },
        orderBy: { payment_date: 'asc' },
    });

    const grouped: { [key: string]: { revenue: number; count: number } } = {};

    payments.forEach((payment) => {
        if (!payment.payment_date) return;
        const d = new Date(payment.payment_date);
        let key = '';

        if (params.group_by === 'year') {
            key = `${d.getFullYear()}`;
        } else if (params.group_by === 'month') {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        if (!grouped[key]) {
            grouped[key] = { revenue: 0, count: 0 };
        }
        grouped[key].revenue += Number(payment.amount);
        grouped[key].count += 1;
    });

    return Object.entries(grouped).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        count: data.count,
    }));
};

const getTopItems = async (params: { item_type: ItemType; limit: number; from_date?: string; to_date?: string }) => {
    const limit = Math.max(1, Number(params.limit) || 5);
    const bookingWhere: any = {};

    if (params.from_date || params.to_date) {
        bookingWhere.created_at = {
            ...(params.from_date ? { gte: new Date(params.from_date) } : {}),
            ...(params.to_date ? { lte: new Date(params.to_date) } : {}),
        };
    }

    const grouped = await prisma.booking_items.groupBy({
        by: ['item_id'],
        where: {
            item_type: params.item_type,
            ...(Object.keys(bookingWhere).length > 0 ? { bookings: bookingWhere } : {}),
        },
        _sum: {
            quantity: true,
        },
        orderBy: {
            _sum: {
                quantity: 'desc',
            },
        },
        take: limit,
    });

    const itemIds = grouped.map((g) => g.item_id);

    let itemsDetails: any[] = [];
    if (params.item_type === 'tour') {
        itemsDetails = await prisma.tours.findMany({
            where: { id: { in: itemIds } },
            include: { tour_images: { take: 1, orderBy: { sort_order: 'asc' } } },
        });
    } else if (params.item_type === 'hotel') {
        itemsDetails = await prisma.hotels.findMany({
            where: { id: { in: itemIds } },
            include: { hotel_images: { take: 1, orderBy: { sort_order: 'asc' } } },
        });
    } else if (params.item_type === 'flight') {
        itemsDetails = await prisma.flights.findMany({
            where: { id: { in: itemIds } },
            include: { planes: true },
        });
    }

    const detailsMap = new Map(itemsDetails.map((item) => [item.id, item]));

    return grouped.map((g) => ({
        item: detailsMap.get(g.item_id) ?? null,
        totalBooked: g._sum.quantity ?? 0,
    }));
};

export default {
    // users
    getUsers, getUserById, createUser, updateUser, updateUserRole, deleteUser,
    // tours
    getTours, getTourById, createTour, updateTour, deleteTour, setTourTrending,
    getTourDepartures, createTourDeparture, updateTourDeparture, deleteTourDeparture,
    addTourImages, updateTourImageOrder, deleteTourImage,
    // hotels
    getHotels, getHotelById, createHotel, updateHotel, deleteHotel, setHotelTrending,
    addHotelImages, updateHotelImageOrder, deleteHotelImage,
    // planes
    getPlanes, getPlaneById, createPlane, updatePlane, deletePlane,
    // flights
    getFlights, getFlightById, createFlight, updateFlight, deleteFlight,
    // bookings
    getBookings, getBookingById, getBookingsByUser, deleteBooking,
    // payments
    getPayments, getPaymentById, getPaymentsByBooking, updatePaymentStatus,
    // reviews
    getReviews, deleteReview,
    // dashboard
    getDashboardStats, getRevenueStats, getTopItems,
};
