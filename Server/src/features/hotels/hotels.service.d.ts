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
declare const getHotels: (params: HotelFilterParams) => Promise<{
    hotels: any[];
    total: number;
    page: number;
    limit: number;
}>;
declare const getTrendingHotels: (limit?: number) => Promise<any[]>;
declare const getTopHotels: (limit?: number) => Promise<any[]>;
declare const getHotelById: (id: string) => Promise<any>;
declare const checkRoomAvailability: (id: string, roomsNeeded?: number, checkIn?: string, checkOut?: string) => Promise<{
    hotel_id: string;
    available_rooms: number;
    is_available: boolean;
    message: string | undefined;
    nights: number;
    price_per_night: number;
    estimated_total: number;
} | null>;
declare const _default: {
    getHotels: typeof getHotels;
    getTrendingHotels: typeof getTrendingHotels;
    getTopHotels: typeof getTopHotels;
    getHotelById: typeof getHotelById;
    checkRoomAvailability: typeof checkRoomAvailability;
};
export default _default;
