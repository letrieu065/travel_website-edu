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
// (Đã thêm)
const getPagination = (params) => {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
/* ============================== USERS ============================== */
const getUsers = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
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
    const [total, items] = yield Promise.all([
        prisma_1.default.users.count({ where }),
        prisma_1.default.users.findMany({
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
});
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.users.findUnique({
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
});
const createUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.users.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new Error('Email đã được sử dụng');
    }
    let password_hash;
    if (data.password) {
        password_hash = yield bcrypt_1.default.hash(data.password, 10);
    }
    return prisma_1.default.users.create({
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
});
const updateUser = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (data.full_name !== undefined)
        updateData.full_name = data.full_name;
    if (data.phone_number !== undefined)
        updateData.phone_number = data.phone_number;
    if (data.avatar_url !== undefined)
        updateData.avatar_url = data.avatar_url;
    if (data.role !== undefined)
        updateData.role = data.role;
    if (data.email !== undefined)
        updateData.email = data.email;
    if (data.password) {
        updateData.password_hash = yield bcrypt_1.default.hash(data.password, 10);
    }
    return prisma_1.default.users.update({
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
});
const updateUserRole = (id, role) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.users.update({
        where: { id },
        data: { role },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
        },
    });
});
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.users.delete({
        where: { id },
    });
});
/* ============================== TOURS ============================== */
const getTours = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
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
    if (params.is_trending !== undefined) {
        where.is_trending = params.is_trending;
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.tours.count({ where }),
        prisma_1.default.tours.findMany({
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
});
const getTourById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tours.findUnique({
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
});
const createTour = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return prisma_1.default.tours.create({
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
            is_trending: (_a = data.is_trending) !== null && _a !== void 0 ? _a : false,
        },
    });
});
const updateTour = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tours.update({
        where: { id },
        data,
    });
});
const deleteTour = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tours.delete({
        where: { id },
    });
});
const setTourTrending = (id, is_trending) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tours.update({
        where: { id },
        data: { is_trending },
    });
});
// Tour departures
const getTourDepartures = (tourId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_departures.findMany({
        where: { tour_id: tourId },
        orderBy: { start_date: 'asc' },
    });
});
const createTourDeparture = (tourId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_departures.create({
        data: {
            tour_id: tourId,
            start_date: new Date(data.start_date),
            price: data.price,
            discount_price: data.discount_price,
            available_seats: data.available_seats,
        },
    });
});
const updateTourDeparture = (departureId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = {};
    if (data.start_date)
        updateData.start_date = new Date(data.start_date);
    if (data.price !== undefined)
        updateData.price = data.price;
    if (data.discount_price !== undefined)
        updateData.discount_price = data.discount_price;
    if (data.available_seats !== undefined)
        updateData.available_seats = data.available_seats;
    return prisma_1.default.tour_departures.update({
        where: { id: departureId },
        data: updateData,
    });
});
const deleteTourDeparture = (departureId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_departures.delete({
        where: { id: departureId },
    });
});
// Tour images
const addTourImages = (tourId, images) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_images.createMany({
        data: images.map((img) => { var _a; return ({
            tour_id: tourId,
            url: img.url,
            sort_order: (_a = img.sort_order) !== null && _a !== void 0 ? _a : 0,
        }); }),
    });
});
const updateTourImageOrder = (tourId, orders) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction(orders.map((order) => prisma_1.default.tour_images.update({
        where: { id: order.id },
        data: { sort_order: order.sort_order },
    })));
});
const deleteTourImage = (imageId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.tour_images.delete({
        where: { id: imageId },
    });
});
/* ============================== HOTELS ============================== */
const getHotels = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
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
    if (params.is_trending !== undefined) {
        where.is_trending = params.is_trending;
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.hotels.count({ where }),
        prisma_1.default.hotels.findMany({
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
});
const getHotelById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotels.findUnique({
        where: { id },
        include: {
            hotel_images: {
                orderBy: { sort_order: 'asc' },
            },
        },
    });
});
const createHotel = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    return prisma_1.default.hotels.create({
        data: {
            name: data.name,
            description: data.description,
            city: data.city,
            address: data.address,
            star_rating: data.star_rating,
            price_per_night: data.price_per_night,
            discount_price: data.discount_price,
            amenities: (_a = data.amenities) !== null && _a !== void 0 ? _a : [],
            available_rooms: data.available_rooms,
            is_trending: (_b = data.is_trending) !== null && _b !== void 0 ? _b : false,
        },
    });
});
const updateHotel = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotels.update({
        where: { id },
        data,
    });
});
const deleteHotel = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotels.delete({
        where: { id },
    });
});
const setHotelTrending = (id, is_trending) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotels.update({
        where: { id },
        data: { is_trending },
    });
});
// Hotel images
const addHotelImages = (hotelId, images) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotel_images.createMany({
        data: images.map((img) => { var _a; return ({
            hotel_id: hotelId,
            url: img.url,
            sort_order: (_a = img.sort_order) !== null && _a !== void 0 ? _a : 0,
        }); }),
    });
});
const updateHotelImageOrder = (hotelId, orders) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.$transaction(orders.map((order) => prisma_1.default.hotel_images.update({
        where: { id: order.id },
        data: { sort_order: order.sort_order },
    })));
});
const deleteHotelImage = (imageId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.hotel_images.delete({
        where: { id: imageId },
    });
});
/* ============================== PLANES ============================== */
const getPlanes = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
    if (params.search) {
        where.OR = [
            { airline: { contains: params.search, mode: 'insensitive' } },
            { plane_number: { contains: params.search, mode: 'insensitive' } },
        ];
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.planes.count({ where }),
        prisma_1.default.planes.findMany({
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
});
const getPlaneById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.planes.findUnique({
        where: { id },
        include: {
            flights: {
                orderBy: { departure_time: 'desc' },
                take: 10,
            },
        },
    });
});
const createPlane = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.planes.create({
        data: {
            airline: data.airline,
            plane_number: data.plane_number,
            total_seats: data.total_seats,
        },
    });
});
const updatePlane = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.planes.update({
        where: { id },
        data,
    });
});
const deletePlane = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.planes.delete({
        where: { id },
    });
});
/* ============================== FLIGHTS ============================== */
const getFlights = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
    if (params.departure_airport) {
        where.departure_airport = { contains: params.departure_airport, mode: 'insensitive' };
    }
    if (params.arrival_airport) {
        where.arrival_airport = { contains: params.arrival_airport, mode: 'insensitive' };
    }
    if (params.from_date || params.to_date) {
        where.departure_time = Object.assign(Object.assign({}, (params.from_date ? { gte: new Date(params.from_date) } : {})), (params.to_date ? { lte: new Date(params.to_date) } : {}));
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.flights.count({ where }),
        prisma_1.default.flights.findMany({
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
});
const getFlightById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.flights.findUnique({
        where: { id },
        include: {
            planes: true,
        },
    });
});
const createFlight = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.flights.create({
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
});
const updateFlight = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = Object.assign({}, data);
    if (data.departure_time)
        updateData.departure_time = new Date(data.departure_time);
    if (data.arrival_time)
        updateData.arrival_time = new Date(data.arrival_time);
    return prisma_1.default.flights.update({
        where: { id },
        data: updateData,
        include: {
            planes: true,
        },
    });
});
const deleteFlight = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.flights.delete({
        where: { id },
    });
});
/* ============================== BOOKINGS ============================== */
const getBookings = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
    if (params.user_id) {
        where.user_id = params.user_id;
    }
    if (params.from_date || params.to_date) {
        where.created_at = Object.assign(Object.assign({}, (params.from_date ? { gte: new Date(params.from_date) } : {})), (params.to_date ? { lte: new Date(params.to_date) } : {}));
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.bookings.count({ where }),
        prisma_1.default.bookings.findMany({
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
});
const getBookingById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bookings.findUnique({
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
});
const getBookingsByUser = (userId, params) => __awaiter(void 0, void 0, void 0, function* () {
    return getBookings(Object.assign(Object.assign({}, params), { user_id: userId }));
});
const deleteBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.bookings.delete({
        where: { id },
    });
});
/* ============================== PAYMENTS ============================== */
const getPayments = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
    if (params.payment_status) {
        where.payment_status = params.payment_status;
    }
    if (params.payment_method) {
        where.payment_method = { contains: params.payment_method, mode: 'insensitive' };
    }
    if (params.from_date || params.to_date) {
        where.payment_date = Object.assign(Object.assign({}, (params.from_date ? { gte: new Date(params.from_date) } : {})), (params.to_date ? { lte: new Date(params.to_date) } : {}));
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.payments.count({ where }),
        prisma_1.default.payments.findMany({
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
});
const getPaymentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payments.findUnique({
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
});
const getPaymentsByBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payments.findMany({
        where: { booking_id: bookingId },
        orderBy: { payment_date: 'desc' },
    });
});
const updatePaymentStatus = (id, payment_status) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.payments.update({
        where: { id },
        data: {
            payment_status,
            payment_date: payment_status === 'paid' ? new Date() : undefined,
        },
    });
});
/* ============================== REVIEWS ============================== */
const getReviews = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params);
    const where = {};
    if (params.item_type) {
        where.item_type = params.item_type;
    }
    if (params.item_id) {
        where.item_id = params.item_id;
    }
    if (params.rating !== undefined) {
        where.rating = Number(params.rating);
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.reviews.count({ where }),
        prisma_1.default.reviews.findMany({
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
});
const deleteReview = (userId, itemId, itemType) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.reviews.delete({
        where: {
            user_id_item_id_item_type: {
                user_id: userId,
                item_id: itemId,
                item_type: itemType,
            },
        },
    });
});
/* ============================== DASHBOARD ============================== */
const getDashboardStats = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const [totalUsers, totalBookings, totalTours, totalHotels, totalFlights, paidPayments, recentBookings, recentUsers] = yield Promise.all([
        prisma_1.default.users.count(),
        prisma_1.default.bookings.count(),
        prisma_1.default.tours.count(),
        prisma_1.default.hotels.count(),
        prisma_1.default.flights.count(),
        prisma_1.default.payments.aggregate({
            where: { payment_status: 'paid' },
            _sum: { amount: true },
        }),
        prisma_1.default.bookings.findMany({
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
        prisma_1.default.users.findMany({
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
        totalRevenue: Number((_a = paidPayments._sum.amount) !== null && _a !== void 0 ? _a : 0),
        recentBookings,
        recentUsers,
    };
});
const getRevenueStats = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const from = new Date(params.from_date);
    const to = new Date(params.to_date);
    const payments = yield prisma_1.default.payments.findMany({
        where: {
            payment_status: 'paid',
            payment_date: {
                gte: from,
                lte: to,
            },
        },
        orderBy: { payment_date: 'asc' },
    });
    const grouped = {};
    payments.forEach((payment) => {
        if (!payment.payment_date)
            return;
        const d = new Date(payment.payment_date);
        let key = '';
        if (params.group_by === 'year') {
            key = `${d.getFullYear()}`;
        }
        else if (params.group_by === 'month') {
            key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        else {
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
});
const getTopItems = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = Math.max(1, Number(params.limit) || 5);
    const bookingWhere = {};
    if (params.from_date || params.to_date) {
        bookingWhere.created_at = Object.assign(Object.assign({}, (params.from_date ? { gte: new Date(params.from_date) } : {})), (params.to_date ? { lte: new Date(params.to_date) } : {}));
    }
    const grouped = yield prisma_1.default.booking_items.groupBy({
        by: ['item_id'],
        where: Object.assign({ item_type: params.item_type }, (Object.keys(bookingWhere).length > 0 ? { bookings: bookingWhere } : {})),
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
    let itemsDetails = [];
    if (params.item_type === 'tour') {
        itemsDetails = yield prisma_1.default.tours.findMany({
            where: { id: { in: itemIds } },
            include: { tour_images: { take: 1, orderBy: { sort_order: 'asc' } } },
        });
    }
    else if (params.item_type === 'hotel') {
        itemsDetails = yield prisma_1.default.hotels.findMany({
            where: { id: { in: itemIds } },
            include: { hotel_images: { take: 1, orderBy: { sort_order: 'asc' } } },
        });
    }
    else if (params.item_type === 'flight') {
        itemsDetails = yield prisma_1.default.flights.findMany({
            where: { id: { in: itemIds } },
            include: { planes: true },
        });
    }
    const detailsMap = new Map(itemsDetails.map((item) => [item.id, item]));
    return grouped.map((g) => { var _a, _b; return ({
        item: (_a = detailsMap.get(g.item_id)) !== null && _a !== void 0 ? _a : null,
        totalBooked: (_b = g._sum.quantity) !== null && _b !== void 0 ? _b : 0,
    }); });
});
exports.default = {
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
//# sourceMappingURL=admin.service.js.map