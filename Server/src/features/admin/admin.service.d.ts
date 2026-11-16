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
    start_date: string;
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
    departure_time: string;
    arrival_time: string;
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
declare const getUsers: (params: PaginationParams & {
    role?: string;
    auth_provider?: string;
}) => Promise<PaginatedResult<any>>;
declare const getUserById: (id: string) => Promise<{
    auth_provider: string | null;
    avatar_url: string | null;
    bookings: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    created_at: Date | null;
    email: string;
    full_name: string;
    id: string;
    phone_number: string | null;
    reviews: {
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: Date | null;
        item_id: string;
        item_type: string;
    }[];
    role: string | null;
} | null>;
declare const createUser: (data: UserData) => Promise<{
    avatar_url: string | null;
    created_at: Date | null;
    email: string;
    full_name: string;
    id: string;
    phone_number: string | null;
    role: string | null;
}>;
declare const updateUser: (id: string, data: Partial<UserData>) => Promise<{
    avatar_url: string | null;
    created_at: Date | null;
    email: string;
    full_name: string;
    id: string;
    phone_number: string | null;
    role: string | null;
}>;
declare const updateUserRole: (id: string, role: 'user' | 'admin') => Promise<{
    email: string;
    full_name: string;
    id: string;
    role: string | null;
}>;
declare const deleteUser: (id: string) => Promise<{
    id: string;
    email: string;
    password_hash: string | null;
    full_name: string;
    phone_number: string | null;
    avatar_url: string | null;
    auth_provider: string | null;
    role: string | null;
    created_at: Date | null;
    google_id: string | null;
    facebook_id: string | null;
}>;
declare const getTours: (params: PaginationParams & {
    tour_type?: string;
    is_trending?: boolean;
}) => Promise<PaginatedResult<any>>;
declare const getTourById: (id: string) => Promise<({
    tour_departures: {
        id: string;
        tour_id: string;
        start_date: Date;
        price: import("@prisma/client-runtime-utils").Decimal;
        discount_price: import("@prisma/client-runtime-utils").Decimal | null;
        available_seats: number;
    }[];
    tour_images: {
        id: string;
        tour_id: string;
        url: string;
        sort_order: number;
        created_at: Date | null;
    }[];
} & {
    id: string;
    title: string;
    description: string | null;
    tour_type: string;
    duration: string | null;
    departure_location: string | null;
    destination: string | null;
    is_trending: boolean | null;
    created_at: Date | null;
    destinations: string | null;
    food_include: string | null;
    ideal_time: string | null;
    vehicle: string | null;
}) | null>;
declare const createTour: (data: TourData) => Promise<{
    id: string;
    title: string;
    description: string | null;
    tour_type: string;
    duration: string | null;
    departure_location: string | null;
    destination: string | null;
    is_trending: boolean | null;
    created_at: Date | null;
    destinations: string | null;
    food_include: string | null;
    ideal_time: string | null;
    vehicle: string | null;
}>;
declare const updateTour: (id: string, data: Partial<TourData>) => Promise<{
    id: string;
    title: string;
    description: string | null;
    tour_type: string;
    duration: string | null;
    departure_location: string | null;
    destination: string | null;
    is_trending: boolean | null;
    created_at: Date | null;
    destinations: string | null;
    food_include: string | null;
    ideal_time: string | null;
    vehicle: string | null;
}>;
declare const deleteTour: (id: string) => Promise<{
    id: string;
    title: string;
    description: string | null;
    tour_type: string;
    duration: string | null;
    departure_location: string | null;
    destination: string | null;
    is_trending: boolean | null;
    created_at: Date | null;
    destinations: string | null;
    food_include: string | null;
    ideal_time: string | null;
    vehicle: string | null;
}>;
declare const setTourTrending: (id: string, is_trending: boolean) => Promise<{
    id: string;
    title: string;
    description: string | null;
    tour_type: string;
    duration: string | null;
    departure_location: string | null;
    destination: string | null;
    is_trending: boolean | null;
    created_at: Date | null;
    destinations: string | null;
    food_include: string | null;
    ideal_time: string | null;
    vehicle: string | null;
}>;
declare const getTourDepartures: (tourId: string) => Promise<{
    id: string;
    tour_id: string;
    start_date: Date;
    price: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    available_seats: number;
}[]>;
declare const createTourDeparture: (tourId: string, data: TourDepartureData) => Promise<{
    id: string;
    tour_id: string;
    start_date: Date;
    price: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    available_seats: number;
}>;
declare const updateTourDeparture: (departureId: string, data: Partial<TourDepartureData>) => Promise<{
    id: string;
    tour_id: string;
    start_date: Date;
    price: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    available_seats: number;
}>;
declare const deleteTourDeparture: (departureId: string) => Promise<{
    id: string;
    tour_id: string;
    start_date: Date;
    price: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    available_seats: number;
}>;
declare const addTourImages: (tourId: string, images: ImageData[]) => Promise<import(".prisma/client").Prisma.BatchPayload>;
declare const updateTourImageOrder: (tourId: string, orders: {
    id: string;
    sort_order: number;
}[]) => Promise<{
    id: string;
    tour_id: string;
    url: string;
    sort_order: number;
    created_at: Date | null;
}[]>;
declare const deleteTourImage: (imageId: string) => Promise<{
    id: string;
    tour_id: string;
    url: string;
    sort_order: number;
    created_at: Date | null;
}>;
declare const getHotels: (params: PaginationParams & {
    city?: string;
    star_rating?: number;
    is_trending?: boolean;
}) => Promise<PaginatedResult<any>>;
declare const getHotelById: (id: string) => Promise<({
    hotel_images: {
        id: string;
        hotel_id: string;
        url: string;
        sort_order: number;
        created_at: Date | null;
    }[];
} & {
    id: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    star_rating: number | null;
    price_per_night: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    amenities: string[];
    available_rooms: number;
    is_trending: boolean | null;
    created_at: Date | null;
}) | null>;
declare const createHotel: (data: HotelData) => Promise<{
    id: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    star_rating: number | null;
    price_per_night: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    amenities: string[];
    available_rooms: number;
    is_trending: boolean | null;
    created_at: Date | null;
}>;
declare const updateHotel: (id: string, data: Partial<HotelData>) => Promise<{
    id: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    star_rating: number | null;
    price_per_night: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    amenities: string[];
    available_rooms: number;
    is_trending: boolean | null;
    created_at: Date | null;
}>;
declare const deleteHotel: (id: string) => Promise<{
    id: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    star_rating: number | null;
    price_per_night: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    amenities: string[];
    available_rooms: number;
    is_trending: boolean | null;
    created_at: Date | null;
}>;
declare const setHotelTrending: (id: string, is_trending: boolean) => Promise<{
    id: string;
    name: string;
    description: string | null;
    city: string;
    address: string;
    star_rating: number | null;
    price_per_night: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    amenities: string[];
    available_rooms: number;
    is_trending: boolean | null;
    created_at: Date | null;
}>;
declare const addHotelImages: (hotelId: string, images: ImageData[]) => Promise<import(".prisma/client").Prisma.BatchPayload>;
declare const updateHotelImageOrder: (hotelId: string, orders: {
    id: string;
    sort_order: number;
}[]) => Promise<{
    id: string;
    hotel_id: string;
    url: string;
    sort_order: number;
    created_at: Date | null;
}[]>;
declare const deleteHotelImage: (imageId: string) => Promise<{
    id: string;
    hotel_id: string;
    url: string;
    sort_order: number;
    created_at: Date | null;
}>;
declare const getPlanes: (params: PaginationParams) => Promise<PaginatedResult<any>>;
declare const getPlaneById: (id: string) => Promise<({
    flights: {
        id: string;
        plane_id: string;
        departure_time: Date;
        arrival_time: Date;
        ticket_price: import("@prisma/client-runtime-utils").Decimal;
        available_seats: number;
        departure_airport: string;
        arrival_airport: string;
        created_at: Date | null;
    }[];
} & {
    id: string;
    airline: string;
    plane_number: string;
    total_seats: number;
}) | null>;
declare const createPlane: (data: PlaneData) => Promise<{
    id: string;
    airline: string;
    plane_number: string;
    total_seats: number;
}>;
declare const updatePlane: (id: string, data: Partial<PlaneData>) => Promise<{
    id: string;
    airline: string;
    plane_number: string;
    total_seats: number;
}>;
declare const deletePlane: (id: string) => Promise<{
    id: string;
    airline: string;
    plane_number: string;
    total_seats: number;
}>;
declare const getFlights: (params: PaginationParams & {
    departure_airport?: string;
    arrival_airport?: string;
    from_date?: string;
    to_date?: string;
}) => Promise<PaginatedResult<any>>;
declare const getFlightById: (id: string) => Promise<({
    planes: {
        id: string;
        airline: string;
        plane_number: string;
        total_seats: number;
    };
} & {
    id: string;
    plane_id: string;
    departure_time: Date;
    arrival_time: Date;
    ticket_price: import("@prisma/client-runtime-utils").Decimal;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    created_at: Date | null;
}) | null>;
declare const createFlight: (data: FlightData) => Promise<{
    planes: {
        id: string;
        airline: string;
        plane_number: string;
        total_seats: number;
    };
} & {
    id: string;
    plane_id: string;
    departure_time: Date;
    arrival_time: Date;
    ticket_price: import("@prisma/client-runtime-utils").Decimal;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    created_at: Date | null;
}>;
declare const updateFlight: (id: string, data: Partial<FlightData>) => Promise<{
    planes: {
        id: string;
        airline: string;
        plane_number: string;
        total_seats: number;
    };
} & {
    id: string;
    plane_id: string;
    departure_time: Date;
    arrival_time: Date;
    ticket_price: import("@prisma/client-runtime-utils").Decimal;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    created_at: Date | null;
}>;
declare const deleteFlight: (id: string) => Promise<{
    id: string;
    plane_id: string;
    departure_time: Date;
    arrival_time: Date;
    ticket_price: import("@prisma/client-runtime-utils").Decimal;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    created_at: Date | null;
}>;
declare const getBookings: (params: PaginationParams & {
    user_id?: string;
    from_date?: string;
    to_date?: string;
}) => Promise<PaginatedResult<any>>;
declare const getBookingById: (id: string) => Promise<({
    booking_items: {
        booking_id: string;
        item_type: string;
        quantity: number;
        unit_price: import("@prisma/client-runtime-utils").Decimal;
        check_in: Date | null;
        check_out: Date | null;
        item_id: string;
    }[];
    payments: {
        id: string;
        booking_id: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        payment_method: string;
        transaction_id: string | null;
        payment_status: string | null;
        payment_date: Date | null;
    }[];
    users: {
        email: string;
        full_name: string;
        id: string;
        phone_number: string | null;
    } | null;
} & {
    id: string;
    user_id: string | null;
    total_price: import("@prisma/client-runtime-utils").Decimal;
    created_at: Date | null;
}) | null>;
declare const getBookingsByUser: (userId: string, params: PaginationParams) => Promise<PaginatedResult<any>>;
declare const deleteBooking: (id: string) => Promise<{
    id: string;
    user_id: string | null;
    total_price: import("@prisma/client-runtime-utils").Decimal;
    created_at: Date | null;
}>;
declare const getPayments: (params: PaginationParams & {
    payment_status?: PaymentStatus;
    payment_method?: string;
    from_date?: string;
    to_date?: string;
}) => Promise<PaginatedResult<any>>;
declare const getPaymentById: (id: string) => Promise<({
    bookings: ({
        booking_items: {
            booking_id: string;
            item_type: string;
            quantity: number;
            unit_price: import("@prisma/client-runtime-utils").Decimal;
            check_in: Date | null;
            check_out: Date | null;
            item_id: string;
        }[];
        users: {
            email: string;
            full_name: string;
            id: string;
            phone_number: string | null;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    }) | null;
} & {
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}) | null>;
declare const getPaymentsByBooking: (bookingId: string) => Promise<{
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}[]>;
declare const updatePaymentStatus: (id: string, payment_status: PaymentStatus) => Promise<{
    id: string;
    booking_id: string | null;
    amount: import("@prisma/client-runtime-utils").Decimal;
    payment_method: string;
    transaction_id: string | null;
    payment_status: string | null;
    payment_date: Date | null;
}>;
declare const getReviews: (params: PaginationParams & {
    item_type?: ItemType;
    item_id?: string;
    rating?: number;
}) => Promise<PaginatedResult<any>>;
declare const deleteReview: (userId: string, itemId: string, itemType: ItemType) => Promise<{
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: Date | null;
    item_id: string;
    item_type: string;
}>;
declare const getDashboardStats: () => Promise<{
    totalUsers: number;
    totalBookings: number;
    totalTours: number;
    totalHotels: number;
    totalFlights: number;
    totalRevenue: number;
    recentBookings: ({
        payments: {
            id: string;
            booking_id: string | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
            payment_method: string;
            transaction_id: string | null;
            payment_status: string | null;
            payment_date: Date | null;
        }[];
        users: {
            email: string;
            full_name: string;
            id: string;
        } | null;
    } & {
        id: string;
        user_id: string | null;
        total_price: import("@prisma/client-runtime-utils").Decimal;
        created_at: Date | null;
    })[];
    recentUsers: {
        created_at: Date | null;
        email: string;
        full_name: string;
        id: string;
        role: string | null;
    }[];
}>;
declare const getRevenueStats: (params: {
    from_date: string;
    to_date: string;
    group_by: 'day' | 'month' | 'year';
}) => Promise<{
    date: string;
    revenue: number;
    count: number;
}[]>;
declare const getTopItems: (params: {
    item_type: ItemType;
    limit: number;
    from_date?: string;
    to_date?: string;
}) => Promise<{
    item: any;
    totalBooked: number;
}[]>;
declare const _default: {
    getUsers: typeof getUsers;
    getUserById: typeof getUserById;
    createUser: typeof createUser;
    updateUser: typeof updateUser;
    updateUserRole: typeof updateUserRole;
    deleteUser: typeof deleteUser;
    getTours: typeof getTours;
    getTourById: typeof getTourById;
    createTour: typeof createTour;
    updateTour: typeof updateTour;
    deleteTour: typeof deleteTour;
    setTourTrending: typeof setTourTrending;
    getTourDepartures: typeof getTourDepartures;
    createTourDeparture: typeof createTourDeparture;
    updateTourDeparture: typeof updateTourDeparture;
    deleteTourDeparture: typeof deleteTourDeparture;
    addTourImages: typeof addTourImages;
    updateTourImageOrder: typeof updateTourImageOrder;
    deleteTourImage: typeof deleteTourImage;
    getHotels: typeof getHotels;
    getHotelById: typeof getHotelById;
    createHotel: typeof createHotel;
    updateHotel: typeof updateHotel;
    deleteHotel: typeof deleteHotel;
    setHotelTrending: typeof setHotelTrending;
    addHotelImages: typeof addHotelImages;
    updateHotelImageOrder: typeof updateHotelImageOrder;
    deleteHotelImage: typeof deleteHotelImage;
    getPlanes: typeof getPlanes;
    getPlaneById: typeof getPlaneById;
    createPlane: typeof createPlane;
    updatePlane: typeof updatePlane;
    deletePlane: typeof deletePlane;
    getFlights: typeof getFlights;
    getFlightById: typeof getFlightById;
    createFlight: typeof createFlight;
    updateFlight: typeof updateFlight;
    deleteFlight: typeof deleteFlight;
    getBookings: typeof getBookings;
    getBookingById: typeof getBookingById;
    getBookingsByUser: typeof getBookingsByUser;
    deleteBooking: typeof deleteBooking;
    getPayments: typeof getPayments;
    getPaymentById: typeof getPaymentById;
    getPaymentsByBooking: typeof getPaymentsByBooking;
    updatePaymentStatus: typeof updatePaymentStatus;
    getReviews: typeof getReviews;
    deleteReview: typeof deleteReview;
    getDashboardStats: typeof getDashboardStats;
    getRevenueStats: typeof getRevenueStats;
    getTopItems: typeof getTopItems;
};
export default _default;
