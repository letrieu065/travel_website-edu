import { Request, Response } from 'express';
import flightsService from './flights.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== CONTROLLERS ============================== */

// query: page, limit, departure_airport, arrival_airport, departure_date, airline, passengers, min_price, max_price, sort
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

// params: id
const getFlightById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const flight = await flightsService.getFlightById(id);
        if (!flight) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay' });
        }
        return res.status(200).json({ status: 'success', flight });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết chuyến bay');
    }
};

const getAirlines = async (req: Request, res: Response) => {
    try {
        const airlines = await flightsService.getAirlines();
        return res.status(200).json({ status: 'success', airlines });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách hãng hàng không');
    }
};

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

