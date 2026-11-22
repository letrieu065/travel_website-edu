import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

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

// (Đã thêm)
const getPagination = (pageInput: number, limitInput: number) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/* ============================== SERVICE METHODS ============================== */

const getFlights = async (params: FlightFilterParams) => {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where: any = {};

    if (params.departure_airport) {
        where.departure_airport = { contains: params.departure_airport, mode: 'insensitive' };
    }
    if (params.arrival_airport) {
        where.arrival_airport = { contains: params.arrival_airport, mode: 'insensitive' };
    }
    if (params.passengers !== undefined) {
        where.available_seats = { gte: Number(params.passengers) };
    } else {
        where.available_seats = { gt: 0 };
    }

    if (params.departure_date) {
        // Chuyển đổi ngày tìm kiếm sang trọn vẹn 24h theo múi giờ Việt Nam (UTC+7):
        // 00:00:00 VN (UTC+7) tương đương 17:00:00Z ngày hôm trước
        // 23:59:59.999 VN (UTC+7) tương đương 16:59:59.999Z ngày hiện tại
        const dateStr = params.departure_date.split('T')[0];
        const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999+07:00`);
        where.departure_time = { gte: startOfDay, lte: endOfDay };
    }

    if (params.min_price !== undefined || params.max_price !== undefined) {
        where.ticket_price = {
            ...(params.min_price !== undefined ? { gte: params.min_price } : {}),
            ...(params.max_price !== undefined ? { lte: params.max_price } : {}),
        };
    }

    if (params.airline) {
        where.planes = {
            airline: { contains: params.airline, mode: 'insensitive' },
        };
    }

    let orderBy: any = { departure_time: 'asc' };
    if (params.sort === 'price_asc') {
        orderBy = { ticket_price: 'asc' };
    } else if (params.sort === 'price_desc') {
        orderBy = { ticket_price: 'desc' };
    }

    const [total, items] = await Promise.all([
        prisma.flights.count({ where }),
        prisma.flights.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: { planes: true },
        }),
    ]);

    const flights = items.map((f) => ({
        ...f,
        flight_number: f.planes?.plane_number || '',
        ticket_price: Number(f.ticket_price),
    }));

    return { flights, total, page, limit };
};

const getFlightById = async (id: string) => {
    const flight = await prisma.flights.findUnique({
        where: { id },
        include: { planes: true },
    });
    if (!flight) return null;

    return {
        ...flight,
        flight_number: flight.planes?.plane_number || '',
        ticket_price: Number(flight.ticket_price),
    };
};

const getAirlines = async () => {
    const planes = await prisma.planes.findMany({
        distinct: ['airline'],
        select: { airline: true },
        orderBy: { airline: 'asc' },
    });
    return planes.map((p) => p.airline);
};

const getAirports = async () => {
    const departures = await prisma.flights.findMany({
        distinct: ['departure_airport'],
        select: { departure_airport: true },
    });
    const arrivals = await prisma.flights.findMany({
        distinct: ['arrival_airport'],
        select: { arrival_airport: true },
    });
    const airportSet = new Set<string>();
    departures.forEach((f) => {
        if (f.departure_airport) airportSet.add(f.departure_airport);
    });
    arrivals.forEach((f) => {
        if (f.arrival_airport) airportSet.add(f.arrival_airport);
    });
    return Array.from(airportSet).sort();
};

export default {
    getFlights,
    getFlightById,
    getAirlines,
    getAirports,
};

