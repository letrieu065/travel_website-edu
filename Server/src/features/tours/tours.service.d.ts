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
declare const getTours: (params: TourFilterParams) => Promise<{
    tours: {
        id: any;
        title: any;
        description: any;
        tourType: any;
        price: number;
        discountPrice: number | null;
        duration: any;
        destination: any;
        departureLocation: any;
        startDate: any;
        availableSeats: any;
        images: any;
        isTrending: any;
        averageRating: number;
        reviewCount: number;
        departures: any;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
declare const getFeaturedTours: (limit?: number) => Promise<{
    id: any;
    title: any;
    description: any;
    tourType: any;
    price: number;
    discountPrice: number | null;
    duration: any;
    destination: any;
    departureLocation: any;
    startDate: any;
    availableSeats: any;
    images: any;
    isTrending: any;
    averageRating: number;
    reviewCount: number;
    departures: any;
}[]>;
declare const getTrendingTours: (limit?: number) => Promise<{
    id: any;
    title: any;
    description: any;
    tourType: any;
    price: number;
    discountPrice: number | null;
    duration: any;
    destination: any;
    departureLocation: any;
    startDate: any;
    availableSeats: any;
    images: any;
    isTrending: any;
    averageRating: number;
    reviewCount: number;
    departures: any;
}[]>;
declare const getPromotionTours: (limit?: number) => Promise<{
    id: any;
    title: any;
    description: any;
    tourType: any;
    price: number;
    discountPrice: number | null;
    duration: any;
    destination: any;
    departureLocation: any;
    startDate: any;
    availableSeats: any;
    images: any;
    isTrending: any;
    averageRating: number;
    reviewCount: number;
    departures: any;
}[]>;
declare const getTopTourReviews: (limit?: number) => Promise<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string | null;
    user: {
        fullName: string;
        avatarUrl: string | null;
    } | null;
    tour: {
        id: string;
        title: string;
        destination: string | null;
        images: string[];
    } | null;
}[]>;
declare const getTourById: (id: string) => Promise<{
    id: any;
    title: any;
    description: any;
    tourType: any;
    price: number;
    discountPrice: number | null;
    duration: any;
    destination: any;
    departureLocation: any;
    startDate: any;
    availableSeats: any;
    images: any;
    isTrending: any;
    averageRating: number;
    reviewCount: number;
    departures: any;
    destinations: string | null;
    foodInclude: string | null;
    idealTime: string | null;
    vehicle: string | null;
    reviews: ({
        users: {
            avatar_url: string | null;
            full_name: string;
            id: string;
        };
    } & {
        user_id: string;
        rating: number;
        comment: string | null;
        created_at: Date | null;
        item_id: string;
        item_type: string;
    })[];
} | null>;
declare const getTourDepartures: (tourId: string) => Promise<{
    id: string;
    tour_id: string;
    start_date: Date;
    price: import("@prisma/client-runtime-utils").Decimal;
    discount_price: import("@prisma/client-runtime-utils").Decimal | null;
    available_seats: number;
}[]>;
declare const _default: {
    getTours: typeof getTours;
    getFeaturedTours: typeof getFeaturedTours;
    getTrendingTours: typeof getTrendingTours;
    getPromotionTours: typeof getPromotionTours;
    getTopTourReviews: typeof getTopTourReviews;
    getTourById: typeof getTourById;
    getTourDepartures: typeof getTourDepartures;
};
export default _default;
