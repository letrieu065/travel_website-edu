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
import { Request, Response } from 'express';
/**
 * Tìm kiếm danh sách chuyến bay theo chặng bay, ngày bay và số lượng hành khách
 * - Endpoint: GET /api/v1/flights
 * - Query Params: page, limit, departure_airport, arrival_airport, departure_date, airline, passengers, min_price, max_price, sort
 * // (Đã thêm)
 */
declare const getFlights: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy chi tiết một chuyến bay theo ID kèm thông tin máy bay (planes)
 * - Endpoint: GET /api/v1/flights/:id
 * // (Đã thêm)
 */
declare const getFlightById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh sách tất cả các hãng hàng không đang khai thác
 * - Endpoint: GET /api/v1/flights/meta/airlines
 * // (Đã thêm)
 */
declare const getAirlines: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Lấy danh mục tất cả các sân bay đi và đến có trong hệ thống
 * - Endpoint: GET /api/v1/flights/meta/airports
 * // (Đã thêm)
 */
declare const getAirports: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getFlights: typeof getFlights;
    getFlightById: typeof getFlightById;
    getAirlines: typeof getAirlines;
    getAirports: typeof getAirports;
};
export default _default;
