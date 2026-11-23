export interface FlightFilterParams {
    page: number;
    limit: number;
    departure_airport?: string;
    arrival_airport?: string;
    departure_date?: string;
    airline?: string;
    passengers?: number;
    min_price?: number;
    max_price?: number;
    sort?: 'price_asc' | 'price_desc' | 'departure_asc';
}
export declare const AIRPORT_FULL_NAMES: Record<string, string>;
export declare const resolveAirportCodes: (query?: string) => string[];
declare const getFlights: (params: FlightFilterParams) => Promise<{
    flights: {
        id: string;
        plane_id: string;
        departure_time: Date;
        arrival_time: Date;
        available_seats: number;
        departure_airport: string;
        arrival_airport: string;
        created_at: Date | null;
        flight_number: string;
        ticket_price: number;
        planes: {
            id: string;
            airline: string;
            plane_number: string;
            total_seats: number;
        };
    }[];
    total: number;
    page: number;
    limit: number;
}>;
declare const getFlightById: (id: string) => Promise<{
    id: string;
    plane_id: string;
    departure_time: Date;
    arrival_time: Date;
    available_seats: number;
    departure_airport: string;
    arrival_airport: string;
    created_at: Date | null;
    flight_number: string;
    ticket_price: number;
    planes: {
        id: string;
        airline: string;
        plane_number: string;
        total_seats: number;
    };
} | null>;
declare const getAirlines: () => Promise<string[]>;
declare const getAirports: () => Promise<string[]>;
declare const _default: {
    getFlights: typeof getFlights;
    getFlightById: typeof getFlightById;
    getAirlines: typeof getAirlines;
    getAirports: typeof getAirports;
};
export default _default;
