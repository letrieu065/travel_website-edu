import prisma from '../../config/prisma';

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

/* ============================== USERS ============================== */

const getUsers = async (params: PaginationParams & { role?: string; auth_provider?: string }) => { };
const getUserById = async (id: string) => { };
const createUser = async (data: UserData) => { };
const updateUser = async (id: string, data: Partial<UserData>) => { };
const updateUserRole = async (id: string, role: 'user' | 'admin') => { };
const deleteUser = async (id: string) => { };

/* ============================== TOURS ============================== */

const getTours = async (params: PaginationParams & { tour_type?: string; is_trending?: boolean }) => { };
const getTourById = async (id: string) => { };
const createTour = async (data: TourData) => { };
const updateTour = async (id: string, data: Partial<TourData>) => { };
const deleteTour = async (id: string) => { };
const setTourTrending = async (id: string, is_trending: boolean) => { };

// Tour departures
const getTourDepartures = async (tourId: string) => { };
const createTourDeparture = async (tourId: string, data: TourDepartureData) => { };
const updateTourDeparture = async (departureId: string, data: Partial<TourDepartureData>) => { };
const deleteTourDeparture = async (departureId: string) => { };

// Tour images
const addTourImages = async (tourId: string, images: ImageData[]) => { };
const updateTourImageOrder = async (tourId: string, orders: { id: string; sort_order: number }[]) => { };
const deleteTourImage = async (imageId: string) => { };

/* ============================== HOTELS ============================== */

const getHotels = async (params: PaginationParams & { city?: string; star_rating?: number; is_trending?: boolean }) => { };
const getHotelById = async (id: string) => { };
const createHotel = async (data: HotelData) => { };
const updateHotel = async (id: string, data: Partial<HotelData>) => { };
const deleteHotel = async (id: string) => { };
const setHotelTrending = async (id: string, is_trending: boolean) => { };

// Hotel images
const addHotelImages = async (hotelId: string, images: ImageData[]) => { };
const updateHotelImageOrder = async (hotelId: string, orders: { id: string; sort_order: number }[]) => { };
const deleteHotelImage = async (imageId: string) => { };

/* ============================== PLANES ============================== */

const getPlanes = async (params: PaginationParams) => { };
const getPlaneById = async (id: string) => { };
const createPlane = async (data: PlaneData) => { };
const updatePlane = async (id: string, data: Partial<PlaneData>) => { };
const deletePlane = async (id: string) => { };

/* ============================== FLIGHTS ============================== */

const getFlights = async (
    params: PaginationParams & { departure_airport?: string; arrival_airport?: string; from_date?: string; to_date?: string }
) => { };
const getFlightById = async (id: string) => { };
const createFlight = async (data: FlightData) => { };
const updateFlight = async (id: string, data: Partial<FlightData>) => { };
const deleteFlight = async (id: string) => { };

/* ============================== BOOKINGS ============================== */

const getBookings = async (params: PaginationParams & { user_id?: string; from_date?: string; to_date?: string }) => { };
const getBookingById = async (id: string) => { };
const getBookingsByUser = async (userId: string, params: PaginationParams) => { };
const deleteBooking = async (id: string) => { };

/* ============================== PAYMENTS ============================== */

const getPayments = async (
    params: PaginationParams & { payment_status?: PaymentStatus; payment_method?: string; from_date?: string; to_date?: string }
) => { };
const getPaymentById = async (id: string) => { };
const getPaymentsByBooking = async (bookingId: string) => { };
const updatePaymentStatus = async (id: string, payment_status: PaymentStatus) => { };

/* ============================== REVIEWS ============================== */

const getReviews = async (params: PaginationParams & { item_type?: ItemType; item_id?: string; rating?: number }) => { };
const deleteReview = async (userId: string, itemId: string, itemType: ItemType) => { };

/* ============================== DASHBOARD ============================== */

const getDashboardStats = async () => { };
const getRevenueStats = async (params: { from_date: string; to_date: string; group_by: 'day' | 'month' | 'year' }) => { };
const getTopItems = async (params: { item_type: ItemType; limit: number; from_date?: string; to_date?: string }) => { };

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