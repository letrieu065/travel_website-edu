export interface RestaurantFilterParams {
    page: number;
    limit: number;
    search?: string;
    city?: string;
    cuisine?: string;
    min_rating?: number;
    sort?: 'rating_desc' | 'price_asc' | 'price_desc';
}
export interface RestaurantItem {
    id: string;
    name: string;
    city: string;
    address: string;
    cuisine: string;
    average_price: number;
    rating: number;
    review_count: number;
    images: string[];
    description: string;
}
declare const getRestaurants: (params: RestaurantFilterParams) => Promise<{
    restaurants: RestaurantItem[];
    total: number;
    page: number;
    limit: number;
}>;
declare const getTopRestaurants: (limit?: number) => Promise<RestaurantItem[]>;
declare const getRestaurantById: (id: string) => Promise<RestaurantItem | null>;
declare const _default: {
    getRestaurants: typeof getRestaurants;
    getTopRestaurants: typeof getTopRestaurants;
    getRestaurantById: typeof getRestaurantById;
};
export default _default;
