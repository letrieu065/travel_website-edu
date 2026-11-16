/**
 * ============================================================================
 * MODULE COMBOS - SERVICE (Nghiệp vụ Ghép nối Gói Combo & Tính Giá Ưu Đãi)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Ghép nối tour, khách sạn và chuyến bay phù hợp theo cùng điểm đến.
 * - Áp dụng chính sách chiết khấu (10% - 15%) cho khách hàng đặt gói combo trọn gói.
 * - Lọc theo hạn mức ngân sách (budget constraint) của khách hàng.
 * ============================================================================
 */
/**
 * Tiêu chí tìm kiếm và gợi ý combo
 */
export interface ComboSuggestInput {
    destination?: string;
    departure_location?: string;
    start_date?: string;
    nights?: number;
    guests?: number;
    budget?: number;
    discount_percent?: number;
}
/**
 * Gợi ý combo tự động: Ghép Tour + Khách sạn + Vé máy bay kèm ưu đãi
 * // (Đã thêm)
 */
declare const suggestCombo: (input: ComboSuggestInput) => Promise<{
    combos: {
        combo_id: string;
        title: string;
        destination: string;
        guests: number;
        nights: number;
        tour: {
            id: string;
            title: string;
            image: string;
            price_per_guest: number;
            departure: {
                id: string;
                tour_id: string;
                start_date: Date;
                price: import("@prisma/client-runtime-utils").Decimal;
                discount_price: import("@prisma/client-runtime-utils").Decimal | null;
                available_seats: number;
            };
        };
        hotel: {
            id: string;
            name: string;
            city: string;
            star_rating: number | null;
            image: string;
            price_per_night: number;
        } | null;
        flight: {
            id: string;
            airline: string;
            departure_airport: string;
            arrival_airport: string;
            departure_time: Date;
            ticket_price: number;
        } | null;
        pricing: {
            original_total: number;
            combo_discount: number;
            discount_percent: number;
            final_price: number;
        };
    }[];
    total: number;
}>;
/**
 * Lấy danh sách các combo phổ biến nhất
 * // (Đã thêm)
 */
declare const getPopularCombos: (limit?: number) => Promise<{
    combo_id: string;
    title: string;
    destination: string;
    guests: number;
    nights: number;
    tour: {
        id: string;
        title: string;
        image: string;
        price_per_guest: number;
        departure: {
            id: string;
            tour_id: string;
            start_date: Date;
            price: import("@prisma/client-runtime-utils").Decimal;
            discount_price: import("@prisma/client-runtime-utils").Decimal | null;
            available_seats: number;
        };
    };
    hotel: {
        id: string;
        name: string;
        city: string;
        star_rating: number | null;
        image: string;
        price_per_night: number;
    } | null;
    flight: {
        id: string;
        airline: string;
        departure_airport: string;
        arrival_airport: string;
        departure_time: Date;
        ticket_price: number;
    } | null;
    pricing: {
        original_total: number;
        combo_discount: number;
        discount_percent: number;
        final_price: number;
    };
}[]>;
/**
 * Lấy thông tin chi tiết combo kèm danh sách gợi ý khách sạn và chuyến bay theo tourId
 * // (Đã thêm)
 */
declare const getComboByTourId: (tourId: string, guests?: number, nights?: number) => Promise<{
    tour: {
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
    };
    recommended_hotels: ({
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
    })[];
    recommended_flights: ({
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
    })[];
    combo_discount_percent: number;
    guests: number;
    nights: number;
} | null>;
declare const _default: {
    suggestCombo: typeof suggestCombo;
    getPopularCombos: typeof getPopularCombos;
    getComboByTourId: typeof getComboByTourId;
};
export default _default;
