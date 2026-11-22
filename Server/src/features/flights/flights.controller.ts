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
import flightsService from './flights.service';

/**
 * Kiểm tra định dạng UUID v4 hợp lệ
 * // (Đã thêm)
 */
const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Xử lý lỗi chuẩn cho Flights Controller
 * // (Đã thêm)
 */
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const msg = error?.message || defaultMessage;
    if (msg.includes('Không tìm thấy') || error?.code === 'P2025' || error?.code === 'P2007') {
        return res.status(404).json({ status: 'error', message: msg });
    }
    return res.status(500).json({ status: 'error', message: msg });
};

/**
 * Trích xuất an toàn giá trị string từ route params
 * // (Đã thêm)
 */
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== CONTROLLERS ============================== */

/**
 * Tìm kiếm danh sách chuyến bay theo chặng bay, ngày bay và số lượng hành khách
 * - Endpoint: GET /api/v1/flights
 * - Query Params: page, limit, departure_airport, arrival_airport, departure_date, airline, passengers, min_price, max_price, sort
 * // (Đã thêm)
 */
const getFlights = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            departure_airport,
            arrival_airport,
            departure_date,
            airline,
            passengers,
            min_price,
            max_price,
            sort,
        } = req.query;

        const result = await flightsService.getFlights({
            page: Number(page),
            limit: Number(limit),
            departure_airport: departure_airport as string,
            arrival_airport: arrival_airport as string,
            departure_date: departure_date as string,
            airline: airline as string,
            passengers: passengers !== undefined ? Number(passengers) : undefined,
            min_price: min_price !== undefined ? Number(min_price) : undefined,
            max_price: max_price !== undefined ? Number(max_price) : undefined,
            sort: sort as any,
        });

        return res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tìm kiếm chuyến bay');
    }
};

/**
 * Lấy chi tiết một chuyến bay theo ID kèm thông tin máy bay (planes)
 * - Endpoint: GET /api/v1/flights/:id
 * // (Đã thêm)
 */
const getFlightById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        if (!isValidUUID(id)) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay (ID không hợp lệ)' });
        }
        const flight = await flightsService.getFlightById(id);
        if (!flight) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay' });
        }
        return res.status(200).json({ status: 'success', flight });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết chuyến bay');
    }
};

/**
 * Lấy danh sách tất cả các hãng hàng không đang khai thác
 * - Endpoint: GET /api/v1/flights/meta/airlines
 * // (Đã thêm)
 */
const getAirlines = async (req: Request, res: Response) => {
    try {
        const airlines = await flightsService.getAirlines();
        return res.status(200).json({ status: 'success', airlines });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách hãng hàng không');
    }
};

/**
 * Lấy danh mục tất cả các sân bay đi và đến có trong hệ thống
 * - Endpoint: GET /api/v1/flights/meta/airports
 * // (Đã thêm)
 */
const getAirports = async (req: Request, res: Response) => {
    try {
        const airports = await flightsService.getAirports();
        return res.status(200).json({ status: 'success', airports });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách sân bay');
    }
};

export default {
    getFlights,
    getFlightById,
    getAirlines,
    getAirports,
};
