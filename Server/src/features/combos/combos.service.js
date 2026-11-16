"use strict";
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
/* ============================== SERVICE METHODS ============================== */
/**
 * Gợi ý combo tự động: Ghép Tour + Khách sạn + Vé máy bay kèm ưu đãi
 * // (Đã thêm)
 */
const suggestCombo = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const nights = Math.max(1, Number(input.nights) || 2);
    const guests = Math.max(1, Number(input.guests) || 2);
    const discountRate = ((_a = input.discount_percent) !== null && _a !== void 0 ? _a : 10) / 100;
    const [tours, hotels, flights] = yield Promise.all([
        prisma_1.default.tours.findMany({
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
        prisma_1.default.hotels.findMany({
            where: Object.assign({ available_rooms: { gte: 1 } }, (input.destination
                ? { city: { contains: input.destination, mode: 'insensitive' } }
                : {})),
            take: 5,
            orderBy: { star_rating: 'desc' },
            include: {
                hotel_images: { take: 1, orderBy: { sort_order: 'asc' } },
            },
        }),
        prisma_1.default.flights.findMany({
            where: Object.assign({ available_seats: { gte: guests } }, (input.destination
                ? { arrival_airport: { contains: input.destination, mode: 'insensitive' } }
                : {})),
            take: 5,
            orderBy: { ticket_price: 'asc' },
            include: { planes: true },
        }),
    ]);
    const combos = tours.map((tour, index) => {
        var _a, _b, _c, _d, _e, _f;
        var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        const hotel = (_g = hotels[index % Math.max(1, hotels.length)]) !== null && _g !== void 0 ? _g : null;
        const flight = (_h = flights[index % Math.max(1, flights.length)]) !== null && _h !== void 0 ? _h : null;
        const tourDeparture = (_a = tour.tour_departures) === null || _a === void 0 ? void 0 : _a[0];
        const tourPrice = tourDeparture
            ? Number((_j = tourDeparture.discount_price) !== null && _j !== void 0 ? _j : tourDeparture.price) * guests
            : 0;
        const hotelPrice = hotel
            ? Number((_k = hotel.discount_price) !== null && _k !== void 0 ? _k : hotel.price_per_night) * nights
            : 0;
        const flightPrice = flight ? Number(flight.ticket_price) * guests : 0;
        const originalTotal = tourPrice + hotelPrice + flightPrice;
        const comboDiscount = Math.round(originalTotal * discountRate);
        const finalPrice = Math.max(0, originalTotal - comboDiscount);
        return {
            combo_id: `combo_${tour.id}_${(_l = hotel === null || hotel === void 0 ? void 0 : hotel.id) !== null && _l !== void 0 ? _l : 'none'}_${(_m = flight === null || flight === void 0 ? void 0 : flight.id) !== null && _m !== void 0 ? _m : 'none'}`,
            title: `Combo trọn gói: ${tour.title}`,
            destination: tour.destination || input.destination || 'Đa điểm đến',
            guests,
            nights,
            tour: {
                id: tour.id,
                title: tour.title,
                image: (_o = (_c = (_b = tour.tour_images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) !== null && _o !== void 0 ? _o : null,
                price_per_guest: tourDeparture ? Number((_p = tourDeparture.discount_price) !== null && _p !== void 0 ? _p : tourDeparture.price) : 0,
                departure: tourDeparture !== null && tourDeparture !== void 0 ? tourDeparture : null,
            },
            hotel: hotel
                ? {
                    id: hotel.id,
                    name: hotel.name,
                    city: hotel.city,
                    star_rating: hotel.star_rating,
                    image: (_q = (_e = (_d = hotel.hotel_images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url) !== null && _q !== void 0 ? _q : null,
                    price_per_night: Number((_r = hotel.discount_price) !== null && _r !== void 0 ? _r : hotel.price_per_night),
                }
                : null,
            flight: flight
                ? {
                    id: flight.id,
                    airline: (_f = flight.planes) === null || _f === void 0 ? void 0 : _f.airline,
                    departure_airport: flight.departure_airport,
                    arrival_airport: flight.arrival_airport,
                    departure_time: flight.departure_time,
                    ticket_price: Number(flight.ticket_price),
                }
                : null,
            pricing: {
                original_total: originalTotal,
                combo_discount: comboDiscount,
                discount_percent: (_s = input.discount_percent) !== null && _s !== void 0 ? _s : 10,
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
});
/**
 * Lấy danh sách các combo phổ biến nhất
 * // (Đã thêm)
 */
const getPopularCombos = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (limit = 6) {
    const result = yield suggestCombo({ guests: 2, nights: 2, discount_percent: 12 });
    return result.combos.slice(0, limit);
});
/**
 * Lấy thông tin chi tiết combo kèm danh sách gợi ý khách sạn và chuyến bay theo tourId
 * // (Đã thêm)
 */
const getComboByTourId = (tourId_1, ...args_1) => __awaiter(void 0, [tourId_1, ...args_1], void 0, function* (tourId, guests = 2, nights = 2) {
    const tour = yield prisma_1.default.tours.findUnique({
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
    if (!tour)
        return null;
    const destination = tour.destination || '';
    const [hotels, flights] = yield Promise.all([
        prisma_1.default.hotels.findMany({
            where: destination
                ? { city: { contains: destination, mode: 'insensitive' }, available_rooms: { gte: 1 } }
                : { available_rooms: { gte: 1 } },
            take: 3,
            include: { hotel_images: { take: 1 } },
        }),
        prisma_1.default.flights.findMany({
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
});
exports.default = {
    suggestCombo,
    getPopularCombos,
    getComboByTourId,
};
//# sourceMappingURL=combos.service.js.map