"use strict";
/**
 * ============================================================================
 * MODULE FLIGHTS - CONTROLLER (Xử lý HTTP Request cho Vé Máy Bay)
 * ============================================================================
 * Chịu trách nhiệm:
 * - Tiếp nhận và xác thực query filters (sân bay đi/đến, ngày bay, hãng bay, số hành khách).
 * - Cung cấp danh sách chuyến bay khả dụng với số ghế trống (available_seats >= passengers).
 * - Cung cấp danh sách hãng hàng không đối tác và danh mục các sân bay.
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
const flights_service_1 = __importDefault(require("./flights.service"));
/**
 * Kiểm tra định dạng UUID v4 hợp lệ
 * // (Đã thêm)
 */
const isValidUUID = (id) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};
/**
 * Xử lý lỗi chuẩn cho Flights Controller
 * // (Đã thêm)
 */
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = (error === null || error === void 0 ? void 0 : error.message) || defaultMessage;
    if (msg.includes('Không tìm thấy') || (error === null || error === void 0 ? void 0 : error.code) === 'P2025' || (error === null || error === void 0 ? void 0 : error.code) === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
};
/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/* ============================== CONTROLLERS ============================== */
/**
 * Tìm kiếm danh sách chuyến bay theo chặng bay, ngày bay và số lượng hành khách
 * - Endpoint: GET /api/v1/flights
 * - Query Params: page, limit, departure_airport, arrival_airport, departure_date, airline, passengers, min_price, max_price, sort
 * // (Đã thêm)
 */
const getFlights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, departure_airport, arrival_airport, departure_date, airline, passengers, min_price, max_price, sort, } = req.query;
        const result = yield flights_service_1.default.getFlights({
            page: Number(page),
            limit: Number(limit),
            departure_airport: departure_airport,
            arrival_airport: arrival_airport,
            departure_date: departure_date,
            airline: airline,
            passengers: passengers !== undefined ? Number(passengers) : undefined,
            min_price: min_price !== undefined ? Number(min_price) : undefined,
            max_price: max_price !== undefined ? Number(max_price) : undefined,
            sort: sort,
        });
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tìm kiếm chuyến bay');
    }
});
/**
 * Lấy chi tiết một chuyến bay theo ID kèm thông tin máy bay (planes)
 * - Endpoint: GET /api/v1/flights/:id
 * // (Đã thêm)
 */
const getFlightById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay (ID không hợp lệ)' });
        }
        const flight = yield flights_service_1.default.getFlightById(id);
        if (!flight) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay' });
        }
        return res.status(200).json({ status: 'success', flight });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết chuyến bay');
    }
});
/**
 * Lấy danh sách tất cả các hãng hàng không đang khai thác
 * - Endpoint: GET /api/v1/flights/meta/airlines
 * // (Đã thêm)
 */
const getAirlines = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const airlines = yield flights_service_1.default.getAirlines();
        return res.status(200).json({ status: 'success', airlines });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách hãng hàng không');
    }
});
/**
 * Lấy danh mục tất cả các sân bay đi và đến có trong hệ thống
 * - Endpoint: GET /api/v1/flights/meta/airports
 * // (Đã thêm)
 */
const getAirports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const airports = yield flights_service_1.default.getAirports();
        return res.status(200).json({ status: 'success', airports });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách sân bay');
    }
});
exports.default = {
    getFlights,
    getFlightById,
    getAirlines,
    getAirports,
};
//# sourceMappingURL=flights.controller.js.map