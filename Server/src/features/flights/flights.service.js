"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../config/prisma"));
// (Đã thêm)
const getPagination = (pageInput, limitInput) => {
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.max(1, Number(limitInput) || 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
/* ============================== SERVICE METHODS ============================== */
const getFlights = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip } = getPagination(params.page, params.limit);
    const where = {};
    if (params.departure_airport) {
        where.departure_airport = { contains: params.departure_airport, mode: 'insensitive' };
    }
    if (params.arrival_airport) {
        where.arrival_airport = { contains: params.arrival_airport, mode: 'insensitive' };
    }
    if (params.passengers !== undefined) {
        where.available_seats = { gte: Number(params.passengers) };
    }
    else {
        where.available_seats = { gt: 0 };
    }
    if (params.departure_date) {
        const startOfDay = new Date(params.departure_date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(params.departure_date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        where.departure_time = { gte: startOfDay, lte: endOfDay };
    }
    if (params.min_price !== undefined || params.max_price !== undefined) {
        where.ticket_price = Object.assign(Object.assign({}, (params.min_price !== undefined ? { gte: params.min_price } : {})), (params.max_price !== undefined ? { lte: params.max_price } : {}));
    }
    if (params.airline) {
        where.planes = {
            airline: { contains: params.airline, mode: 'insensitive' },
        };
    }
    let orderBy = { departure_time: 'asc' };
    if (params.sort === 'price_asc') {
        orderBy = { ticket_price: 'asc' };
    }
    else if (params.sort === 'price_desc') {
        orderBy = { ticket_price: 'desc' };
    }
    const [total, items] = yield Promise.all([
        prisma_1.default.flights.count({ where }),
        prisma_1.default.flights.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: { planes: true },
        }),
    ]);
    const flights = items.map((f) => (Object.assign(Object.assign({}, f), { ticket_price: Number(f.ticket_price) })));
    return { flights, total, page, limit };
});
const getFlightById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const flight = yield prisma_1.default.flights.findUnique({
        where: { id },
        include: { planes: true },
    });
    if (!flight)
        return null;
    return Object.assign(Object.assign({}, flight), { ticket_price: Number(flight.ticket_price) });
});
const getAirlines = () => __awaiter(void 0, void 0, void 0, function* () {
    const planes = yield prisma_1.default.planes.findMany({
        distinct: ['airline'],
        select: { airline: true },
        orderBy: { airline: 'asc' },
    });
    return planes.map((p) => p.airline);
});
const getAirports = () => __awaiter(void 0, void 0, void 0, function* () {
    const flights = yield prisma_1.default.flights.findMany({
        select: { departure_airport: true, arrival_airport: true },
    });
    const airportSet = new Set();
    flights.forEach((f) => {
        if (f.departure_airport)
            airportSet.add(f.departure_airport);
        if (f.arrival_airport)
            airportSet.add(f.arrival_airport);
    });
    return Array.from(airportSet).sort();
});
exports.default = {
    getFlights,
    getFlightById,
    getAirlines,
    getAirports,
};
//# sourceMappingURL=flights.service.js.map