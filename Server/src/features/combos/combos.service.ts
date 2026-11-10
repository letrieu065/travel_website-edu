import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface ComboSuggestInput {
    destination?: string;
    departure_location?: string;
    start_date?: string;
    nights?: number;
    guests?: number;
    budget?: number;
    discount_percent?: number;
}

/* ============================== SERVICE METHODS ============================== */

// Gợi ý combo tự động: Tour + Khách sạn + Vé máy bay kèm ưu đãi
const suggestCombo = async (input: ComboSuggestInput) => {
    const nights = Math.max(1, Number(input.nights) || 2);
    const guests = Math.max(1, Number(input.guests) || 2);
    const discountRate = (input.discount_percent ?? 10) / 100;

    const [tours, hotels, flights] = await Promise.all([
        prisma.tours.findMany({
            where: input.destination
                ? { destination: { contains: input.destination, mode: 'insensitive' } }
                : {},
            take: 5,
            include: {
                tour_images: { take: 1, orderBy: { sort_order: 'asc' } },
                tour_departures: {
                    where: { available_seats: { gte: guests } },
                    orderBy: { start_date: 'asc' },
                    take: 1,
                },
            },
        }),
        prisma.hotels.findMany({
            where: {
                available_rooms: { gte: 1 },
                ...(input.destination
                    ? { city: { contains: input.destination, mode: 'insensitive' } }
                    : {}),
            },
            take: 5,
            orderBy: { star_rating: 'desc' },
            include: {
                hotel_images: { take: 1, orderBy: { sort_order: 'asc' } },
            },
        }),
        prisma.flights.findMany({
            where: {
                available_seats: { gte: guests },
                ...(input.destination
                    ? { arrival_airport: { contains: input.destination, mode: 'insensitive' } }
                    : {}),
            },
            take: 5,
            orderBy: { ticket_price: 'asc' },
            include: { planes: true },
        }),
    ]);

    const combos = tours.map((tour, index) => {
        const hotel = hotels[index % Math.max(1, hotels.length)] ?? null;
        const flight = flights[index % Math.max(1, flights.length)] ?? null;

        const tourDeparture = tour.tour_departures?.[0];
        const tourPrice = tourDeparture
            ? Number(tourDeparture.discount_price ?? tourDeparture.price) * guests
            : 0;
        const hotelPrice = hotel
            ? Number(hotel.discount_price ?? hotel.price_per_night) * nights
            : 0;
        const flightPrice = flight ? Number(flight.ticket_price) * guests : 0;

        const originalTotal = tourPrice + hotelPrice + flightPrice;
        const comboDiscount = Math.round(originalTotal * discountRate);
        const finalPrice = Math.max(0, originalTotal - comboDiscount);

        return {
            combo_id: `combo_${tour.id}_${hotel?.id ?? 'none'}_${flight?.id ?? 'none'}`,
            title: `Combo trọn gói: ${tour.title}`,
            destination: tour.destination || input.destination || 'Đa điểm đến',
            guests,
            nights,
            tour: {
                id: tour.id,
                title: tour.title,
                image: tour.tour_images?.[0]?.url ?? null,
                price_per_guest: tourDeparture ? Number(tourDeparture.discount_price ?? tourDeparture.price) : 0,
                departure: tourDeparture ?? null,
            },
            hotel: hotel
                ? {
                      id: hotel.id,
                      name: hotel.name,
                      city: hotel.city,
                      star_rating: hotel.star_rating,
                      image: hotel.hotel_images?.[0]?.url ?? null,
                      price_per_night: Number(hotel.discount_price ?? hotel.price_per_night),
                  }
                : null,
            flight: flight
                ? {
                      id: flight.id,
                      airline: flight.planes?.airline,
                      departure_airport: flight.departure_airport,
                      arrival_airport: flight.arrival_airport,
                      departure_time: flight.departure_time,
                      ticket_price: Number(flight.ticket_price),
                  }
                : null,
            pricing: {
                original_total: originalTotal,
                combo_discount: comboDiscount,
                discount_percent: input.discount_percent ?? 10,
                final_price: finalPrice,
            },
        };
    });

    const filtered = input.budget
        ? combos.filter((c) => c.pricing.final_price <= Number(input.budget))
        : combos;

    return {
        combos: filtered,
        total: filtered.length,
    };
};

const getPopularCombos = async (limit: number = 6) => {
    const result = await suggestCombo({ guests: 2, nights: 2, discount_percent: 12 });
    return result.combos.slice(0, limit);
};

const getComboByTourId = async (tourId: string, guests: number = 2, nights: number = 2) => {
    const tour = await prisma.tours.findUnique({
        where: { id: tourId },
        include: {
            tour_images: { orderBy: { sort_order: 'asc' } },
            tour_departures: {
                where: { available_seats: { gte: guests } },
                orderBy: { start_date: 'asc' },
                take: 1,
            },
        },
    });
    if (!tour) return null;

    const destination = tour.destination || '';
    const [hotels, flights] = await Promise.all([
        prisma.hotels.findMany({
            where: destination
                ? { city: { contains: destination, mode: 'insensitive' }, available_rooms: { gte: 1 } }
                : { available_rooms: { gte: 1 } },
            take: 3,
            include: { hotel_images: { take: 1 } },
        }),
        prisma.flights.findMany({
            where: { available_seats: { gte: guests } },
            take: 3,
            orderBy: { ticket_price: 'asc' },
            include: { planes: true },
        }),
    ]);

    return {
        tour,
        recommended_hotels: hotels,
        recommended_flights: flights,
        combo_discount_percent: 10,
        guests,
        nights,
    };
};

export default {
    suggestCombo,
    getPopularCombos,
    getComboByTourId,
};

