export type AdminTab =
    | 'overview'
    | 'bookings'
    | 'payments'
    | 'tours'
    | 'hotels'
    | 'flights'
    | 'users'
    | 'reviews'
    | 'revenue';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<K extends string = string> {
    key: K;
    direction: SortDirection;
}

export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refund_requested' | 'refunded';

export interface DashboardStats {
    totalUsers: number;
    totalBookings: number;
    totalTours: number;
    totalHotels: number;
    totalFlights: number;
    totalRevenue: number;
    recentBookings: BookingItem[];
    recentUsers: UserItem[];
}

export interface TourImageItem {
    id: string;
    tour_id: string;
    url: string;
    sort_order: number;
    created_at?: string | null;
}

export interface TourDepartureItem {
    id: string;
    tour_id: string;
    start_date: string;
    price: number | string;
    discount_price?: number | string | null;
    available_seats: number;
}

export interface TourItem {
    id: string;
    title: string;
    description?: string | null;
    tour_type: string;
    duration?: string | null;
    departure_location?: string | null;
    destination?: string | null;
    destinations?: string | null;
    food_include?: string | null;
    ideal_time?: string | null;
    vehicle?: string | null;
    is_trending?: boolean | null;
    created_at?: string | null;
    tour_images?: TourImageItem[];
    tour_departures?: TourDepartureItem[];
}

export interface HotelImageItem {
    id: string;
    hotel_id: string;
    url: string;
    sort_order: number;
    created_at?: string | null;
}

export interface HotelItem {
    id: string;
    name: string;
    description?: string | null;
    city: string;
    address: string;
    star_rating?: number | null;
    price_per_night: number | string;
    discount_price?: number | string | null;
    amenities?: string[];
    available_rooms: number;
    is_trending?: boolean | null;
    created_at?: string | null;
    hotel_images?: HotelImageItem[];
}

export interface PlaneItem {
    id: string;
    airline: string;
    plane_number: string;
    total_seats: number;
    _count?: {
        flights: number;
    };
}

export interface FlightItem {
    id: string;
    plane_id: string;
    departure_airport: string;
    arrival_airport: string;
    departure_time: string;
    arrival_time: string;
    ticket_price: number | string;
    available_seats: number;
    created_at?: string | null;
    planes?: {
        id: string;
        airline: string;
        plane_number: string;
        total_seats: number;
    } | null;
}

export interface BookingServiceItem {
    booking_id: string;
    item_type: 'tour' | 'hotel' | 'flight' | string;
    item_id: string;
    quantity: number;
    unit_price: number | string;
    check_in?: string | null;
    check_out?: string | null;
}

export interface PaymentRecordItem {
    id: string;
    booking_id?: string | null;
    amount: number | string;
    payment_method: string;
    transaction_id?: string | null;
    payment_status?: PaymentStatusType | string | null;
    payment_date?: string | null;
    bookings?: {
        id: string;
        user_id?: string | null;
        total_price: number | string;
        created_at?: string | null;
        users?: {
            id: string;
            full_name: string;
            email: string;
        } | null;
    } | null;
}

export interface BookingItem {
    id: string;
    user_id?: string | null;
    total_price: number | string;
    created_at?: string | null;
    users?: {
        id?: string;
        full_name: string;
        email: string;
        phone_number?: string | null;
    } | null;
    booking_items?: BookingServiceItem[];
    payments?: PaymentRecordItem[];
}

export interface UserItem {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    auth_provider?: string | null;
    created_at?: string | null;
    _count?: {
        bookings: number;
        reviews: number;
    };
}

export interface UserDetail extends UserItem {
    bookings?: BookingItem[];
    reviews?: ReviewItem[];
}

export interface ReviewItem {
    user_id: string;
    rating: number;
    comment?: string | null;
    created_at?: string | null;
    item_id: string;
    item_type: 'tour' | 'hotel' | 'flight' | string;
    users?: {
        id: string;
        full_name: string;
        email: string;
        avatar_url?: string | null;
    } | null;
}

export interface RevenuePoint {
    date: string;
    revenue: number;
    count: number;
}

export interface TopBookedItemRecord {
    id?: string;
    title?: string;
    name?: string;
    destination?: string | null;
    city?: string | null;
    star_rating?: number | null;
    departure_airport?: string | null;
    arrival_airport?: string | null;
    departure?: {
        id: string;
        start_date: string;
        price: number | string;
        discount_price?: number | string | null;
    };
    planes?: {
        airline?: string;
        plane_number?: string;
    } | null;
}

export interface TopBookedItem {
    item: TopBookedItemRecord | null;
    totalBooked: number;
}

export interface ResolvedItemMeta {
    title: string;
    subtitle: string;
    href: string;
}

export interface ToastNotice {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
}
