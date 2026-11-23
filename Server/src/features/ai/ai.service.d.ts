export interface GenerateItineraryInput {
    budget: number;
    days: number;
    interests: string[];
    destination?: string;
    departure_location?: string;
    guests?: number;
}
export interface CompareToursInput {
    tour_ids: string[];
    priority?: 'budget' | 'rating' | 'duration';
}
declare const generateItinerary: (input: GenerateItineraryInput) => Promise<{
    input: {
        budget: number;
        days: number;
        guests: number;
        interests: string[];
        destination: string;
        departure_location: string;
    };
    ai_narrative: string | null;
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
    recommended_tours: ({
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
    })[];
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
    recommended_handbooks: any[];
}>;
declare const compareTours: (input: CompareToursInput) => Promise<{
    comparison_table: {
        id: string;
        title: string;
        image: string;
        tour_type: string;
        destination: string;
        departure_location: string;
        duration: string;
        price: number;
        effective_price: number;
        vehicle: string;
        food_include: string;
        ideal_time: string;
        destinations_detail: string;
        average_rating: number;
        review_count: number;
    }[];
    best_recommendation: {
        tour_id: string;
        title: string;
        reason: string;
    };
}>;
declare const _default: {
    generateItinerary: typeof generateItinerary;
    compareTours: typeof compareTours;
};
export default _default;
