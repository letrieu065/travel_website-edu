import { Request, Response } from 'express';
import adminService, { ItemType, PaymentStatus } from './admin.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({
        status: 'error',
        message: error.message || defaultMessage,
    });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== USERS ============================== */

// query: page, limit, search, role, auth_provider
const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, role, auth_provider } = req.query;
        const result = await adminService.getUsers({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            role: role as string,
            auth_provider: auth_provider as string,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách người dùng');
    }
};

// params: id
const getUserById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const user = await adminService.getUserById(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
        }
        return res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin người dùng');
    }
};

// body: UserData
const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, full_name, phone_number, avatar_url, role } = req.body;
        if (!email || !full_name) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ email và họ tên' });
        }
        const newUser = await adminService.createUser({
            email,
            password,
            full_name,
            phone_number,
            avatar_url,
            role,
        });
        return res.status(201).json({ status: 'success', message: 'Tạo người dùng thành công', data: newUser });
    } catch (error: any) {
        return handleControllerError(res, error, 'Lỗi khi tạo người dùng');
    }
};

// params: id | body: Partial<UserData>
const updateUser = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const updatedUser = await adminService.updateUser(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật người dùng thành công', data: updatedUser });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật người dùng');
    }
};

// params: id | body: role
const updateUserRole = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Role không hợp lệ (user hoặc admin)' });
        }
        const updatedUser = await adminService.updateUserRole(id, role);
        return res.status(200).json({ status: 'success', message: 'Cập nhật vai trò thành công', data: updatedUser });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật vai trò người dùng');
    }
};

// params: id
const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deleteUser(id);
        return res.status(200).json({ status: 'success', message: 'Xóa người dùng thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa người dùng');
    }
};

/* ============================== TOURS ============================== */

// query: page, limit, search, tour_type, is_trending
const getTours = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, tour_type, is_trending } = req.query;
        const result = await adminService.getTours({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            tour_type: tour_type as string,
            is_trending: is_trending !== undefined ? is_trending === 'true' : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách tour');
    }
};

// params: id
const getTourById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const tour = await adminService.getTourById(id);
        if (!tour) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy tour' });
        }
        return res.status(200).json({ status: 'success', data: tour });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết tour');
    }
};

// body: TourData
const createTour = async (req: Request, res: Response) => {
    try {
        const { title, tour_type } = req.body;
        if (!title || !tour_type) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp tiêu đề và loại tour' });
        }
        const newTour = await adminService.createTour(req.body);
        return res.status(201).json({ status: 'success', message: 'Tạo tour mới thành công', data: newTour });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo tour');
    }
};

// params: id | body: Partial<TourData>
const updateTour = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const updatedTour = await adminService.updateTour(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật tour thành công', data: updatedTour });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật tour');
    }
};

// params: id
const deleteTour = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deleteTour(id);
        return res.status(200).json({ status: 'success', message: 'Xóa tour thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa tour');
    }
};

// params: id | body: is_trending
const setTourTrending = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const { is_trending } = req.body;
        if (typeof is_trending !== 'boolean') {
            return res.status(400).json({ status: 'error', message: 'is_trending phải là giá trị boolean' });
        }
        const updatedTour = await adminService.setTourTrending(id, is_trending);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trạng thái trending thành công', data: updatedTour });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trending cho tour');
    }
};

// params: tourId
const getTourDepartures = async (req: Request, res: Response) => {
    try {
        const tourId = getParam(req.params.tourId);
        const departures = await adminService.getTourDepartures(tourId);
        return res.status(200).json({ status: 'success', data: departures });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch khởi hành của tour');
    }
};

// params: tourId | body: TourDepartureData
const createTourDeparture = async (req: Request, res: Response) => {
    try {
        const tourId = getParam(req.params.tourId);
        const { start_date, price, available_seats } = req.body;
        if (!start_date || price === undefined || available_seats === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp ngày bắt đầu, giá và số chỗ trống' });
        }
        const departure = await adminService.createTourDeparture(tourId, req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm lịch khởi hành thành công', data: departure });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo lịch khởi hành');
    }
};

// params: departureId | body: Partial<TourDepartureData>
const updateTourDeparture = async (req: Request, res: Response) => {
    try {
        const departureId = getParam(req.params.departureId);
        const updated = await adminService.updateTourDeparture(departureId, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật lịch khởi hành thành công', data: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật lịch khởi hành');
    }
};

// params: departureId
const deleteTourDeparture = async (req: Request, res: Response) => {
    try {
        const departureId = getParam(req.params.departureId);
        await adminService.deleteTourDeparture(departureId);
        return res.status(200).json({ status: 'success', message: 'Xóa lịch khởi hành thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa lịch khởi hành');
    }
};

// params: tourId | body: images[]
const addTourImages = async (req: Request, res: Response) => {
    try {
        const tourId = getParam(req.params.tourId);
        const { images } = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp danh sách ảnh (images array)' });
        }
        const result = await adminService.addTourImages(tourId, images);
        return res.status(201).json({ status: 'success', message: 'Thêm ảnh cho tour thành công', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm ảnh cho tour');
    }
};

// params: tourId | body: orders[]
const updateTourImageOrder = async (req: Request, res: Response) => {
    try {
        const tourId = getParam(req.params.tourId);
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ status: 'error', message: 'orders phải là danh sách { id, sort_order }' });
        }
        await adminService.updateTourImageOrder(tourId, orders);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thứ tự ảnh thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi sắp xếp ảnh tour');
    }
};

// params: imageId
const deleteTourImage = async (req: Request, res: Response) => {
    try {
        const imageId = getParam(req.params.imageId);
        await adminService.deleteTourImage(imageId);
        return res.status(200).json({ status: 'success', message: 'Xóa ảnh tour thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa ảnh tour');
    }
};

/* ============================== HOTELS ============================== */

// query: page, limit, search, city, star_rating, is_trending
const getHotels = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, city, star_rating, is_trending } = req.query;
        const result = await adminService.getHotels({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            city: city as string,
            star_rating: star_rating !== undefined ? Number(star_rating) : undefined,
            is_trending: is_trending !== undefined ? is_trending === 'true' : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách khách sạn');
    }
};

// params: id
const getHotelById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const hotel = await adminService.getHotelById(id);
        if (!hotel) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn' });
        }
        return res.status(200).json({ status: 'success', data: hotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết khách sạn');
    }
};

// body: HotelData
const createHotel = async (req: Request, res: Response) => {
    try {
        const { name, city, address, price_per_night, available_rooms } = req.body;
        if (!name || !city || !address || price_per_night === undefined || available_rooms === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ tên, thành phố, địa chỉ, giá và số phòng' });
        }
        const newHotel = await adminService.createHotel(req.body);
        return res.status(201).json({ status: 'success', message: 'Tạo khách sạn thành công', data: newHotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo khách sạn');
    }
};

// params: id | body: Partial<HotelData>
const updateHotel = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const updatedHotel = await adminService.updateHotel(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật khách sạn thành công', data: updatedHotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật khách sạn');
    }
};

// params: id
const deleteHotel = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deleteHotel(id);
        return res.status(200).json({ status: 'success', message: 'Xóa khách sạn thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa khách sạn');
    }
};

// params: id | body: is_trending
const setHotelTrending = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const { is_trending } = req.body;
        if (typeof is_trending !== 'boolean') {
            return res.status(400).json({ status: 'error', message: 'is_trending phải là giá trị boolean' });
        }
        const updatedHotel = await adminService.setHotelTrending(id, is_trending);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trending cho khách sạn thành công', data: updatedHotel });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trending khách sạn');
    }
};

// params: hotelId | body: images[]
const addHotelImages = async (req: Request, res: Response) => {
    try {
        const hotelId = getParam(req.params.hotelId);
        const { images } = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp danh sách ảnh (images array)' });
        }
        const result = await adminService.addHotelImages(hotelId, images);
        return res.status(201).json({ status: 'success', message: 'Thêm ảnh khách sạn thành công', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm ảnh khách sạn');
    }
};

// params: hotelId | body: orders[]
const updateHotelImageOrder = async (req: Request, res: Response) => {
    try {
        const hotelId = getParam(req.params.hotelId);
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ status: 'error', message: 'orders phải là danh sách { id, sort_order }' });
        }
        await adminService.updateHotelImageOrder(hotelId, orders);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thứ tự ảnh khách sạn thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi sắp xếp ảnh khách sạn');
    }
};

// params: imageId
const deleteHotelImage = async (req: Request, res: Response) => {
    try {
        const imageId = getParam(req.params.imageId);
        await adminService.deleteHotelImage(imageId);
        return res.status(200).json({ status: 'success', message: 'Xóa ảnh khách sạn thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa ảnh khách sạn');
    }
};

/* ============================== PLANES ============================== */

// query: page, limit, search
const getPlanes = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const result = await adminService.getPlanes({
            page: Number(page),
            limit: Number(limit),
            search: search as string,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách máy bay');
    }
};

// params: id
const getPlaneById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const plane = await adminService.getPlaneById(id);
        if (!plane) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy máy bay' });
        }
        return res.status(200).json({ status: 'success', data: plane });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin máy bay');
    }
};

// body: PlaneData
const createPlane = async (req: Request, res: Response) => {
    try {
        const { airline, plane_number, total_seats } = req.body;
        if (!airline || !plane_number || total_seats === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp hãng bay, số hiệu và tổng số ghế' });
        }
        const newPlane = await adminService.createPlane(req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm máy bay thành công', data: newPlane });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo máy bay');
    }
};

// params: id | body: Partial<PlaneData>
const updatePlane = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const updated = await adminService.updatePlane(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thông tin máy bay thành công', data: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật máy bay');
    }
};

// params: id
const deletePlane = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deletePlane(id);
        return res.status(200).json({ status: 'success', message: 'Xóa máy bay thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa máy bay');
    }
};

/* ============================== FLIGHTS ============================== */

// query: page, limit, departure_airport, arrival_airport, from_date, to_date
const getFlights = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, departure_airport, arrival_airport, from_date, to_date } = req.query;
        const result = await adminService.getFlights({
            page: Number(page),
            limit: Number(limit),
            departure_airport: departure_airport as string,
            arrival_airport: arrival_airport as string,
            from_date: from_date as string,
            to_date: to_date as string,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách chuyến bay');
    }
};

// params: id
const getFlightById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const flight = await adminService.getFlightById(id);
        if (!flight) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay' });
        }
        return res.status(200).json({ status: 'success', data: flight });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết chuyến bay');
    }
};

// body: FlightData
const createFlight = async (req: Request, res: Response) => {
    try {
        const { plane_id, departure_time, arrival_time, ticket_price, available_seats, departure_airport, arrival_airport } = req.body;
        if (!plane_id || !departure_time || !arrival_time || ticket_price === undefined || available_seats === undefined || !departure_airport || !arrival_airport) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ thông tin chuyến bay' });
        }
        const newFlight = await adminService.createFlight(req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm chuyến bay thành công', data: newFlight });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo chuyến bay');
    }
};

// params: id | body: Partial<FlightData>
const updateFlight = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const updated = await adminService.updateFlight(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật chuyến bay thành công', data: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật chuyến bay');
    }
};

// params: id
const deleteFlight = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deleteFlight(id);
        return res.status(200).json({ status: 'success', message: 'Xóa chuyến bay thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa chuyến bay');
    }
};

/* ============================== BOOKINGS ============================== */

// query: page, limit, user_id, from_date, to_date
const getBookings = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, user_id, from_date, to_date } = req.query;
        const result = await adminService.getBookings({
            page: Number(page),
            limit: Number(limit),
            user_id: user_id as string,
            from_date: from_date as string,
            to_date: to_date as string,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ');
    }
};

// params: id
const getBookingById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const booking = await adminService.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ' });
        }
        return res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết đơn đặt chỗ');
    }
};

// params: userId | query: page, limit
const getBookingsByUser = async (req: Request, res: Response) => {
    try {
        const userId = getParam(req.params.userId);
        const { page = 1, limit = 10 } = req.query;
        const result = await adminService.getBookingsByUser(userId, {
            page: Number(page),
            limit: Number(limit),
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ của người dùng');
    }
};

// params: id
const deleteBooking = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        await adminService.deleteBooking(id);
        return res.status(200).json({ status: 'success', message: 'Xóa đơn đặt chỗ thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đơn đặt chỗ');
    }
};

/* ============================== PAYMENTS ============================== */

// query: page, limit, payment_status, payment_method, from_date, to_date
const getPayments = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, payment_status, payment_method, from_date, to_date } = req.query;
        const result = await adminService.getPayments({
            page: Number(page),
            limit: Number(limit),
            payment_status: payment_status as PaymentStatus,
            payment_method: payment_method as string,
            from_date: from_date as string,
            to_date: to_date as string,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách giao dịch');
    }
};

// params: id
const getPaymentById = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const payment = await adminService.getPaymentById(id);
        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy giao dịch' });
        }
        return res.status(200).json({ status: 'success', data: payment });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết giao dịch');
    }
};

// params: bookingId
const getPaymentsByBooking = async (req: Request, res: Response) => {
    try {
        const bookingId = getParam(req.params.bookingId);
        const payments = await adminService.getPaymentsByBooking(bookingId);
        return res.status(200).json({ status: 'success', data: payments });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy giao dịch của đơn đặt chỗ');
    }
};

// params: id | body: payment_status
const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const id = getParam(req.params.id);
        const { payment_status } = req.body;
        const validStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
        if (!payment_status || !validStatuses.includes(payment_status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Trạng thái thanh toán không hợp lệ (pending, paid, failed, refunded)',
            });
        }
        const updated = await adminService.updatePaymentStatus(id, payment_status);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trạng thái thanh toán thành công', data: updated });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trạng thái thanh toán');
    }
};

/* ============================== REVIEWS ============================== */

// query: page, limit, item_type, item_id, rating
const getReviews = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, item_type, item_id, rating } = req.query;
        const result = await adminService.getReviews({
            page: Number(page),
            limit: Number(limit),
            item_type: item_type as ItemType,
            item_id: item_id as string,
            rating: rating !== undefined ? Number(rating) : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đánh giá');
    }
};

// params: userId, itemType, itemId
const deleteReview = async (req: Request, res: Response) => {
    try {
        const userId = getParam(req.params.userId);
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        if (!userId || !itemType || !itemId) {
            return res.status(400).json({ status: 'error', message: 'Thiếu userId, itemType hoặc itemId' });
        }
        await adminService.deleteReview(userId, itemId, itemType as ItemType);
        return res.status(200).json({ status: 'success', message: 'Xóa đánh giá thành công' });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đánh giá');
    }
};

/* ============================== DASHBOARD ============================== */

// không tham số
const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getDashboardStats();
        return res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thống kê dashboard');
    }
};

// query: from_date, to_date, group_by
const getRevenueStats = async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, group_by = 'day' } = req.query;
        if (!from_date || !to_date) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp from_date và to_date' });
        }
        if (!['day', 'month', 'year'].includes(group_by as string)) {
            return res.status(400).json({ status: 'error', message: 'group_by chỉ chấp nhận day, month hoặc year' });
        }
        const stats = await adminService.getRevenueStats({
            from_date: from_date as string,
            to_date: to_date as string,
            group_by: group_by as 'day' | 'month' | 'year',
        });
        return res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thống kê doanh thu');
    }
};

// query: item_type, limit, from_date, to_date
const getTopItems = async (req: Request, res: Response) => {
    try {
        const { item_type, limit = 5, from_date, to_date } = req.query;
        if (!item_type || !['tour', 'hotel', 'flight'].includes(item_type as string)) {
            return res.status(400).json({ status: 'error', message: 'item_type phải là tour, hotel hoặc flight' });
        }
        const topItems = await adminService.getTopItems({
            item_type: item_type as ItemType,
            limit: Number(limit),
            from_date: from_date as string,
            to_date: to_date as string,
        });
        return res.status(200).json({ status: 'success', data: topItems });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top dịch vụ được đặt');
    }
};

export default {
    // users
    getUsers, getUserById, createUser, updateUser, updateUserRole, deleteUser,
    // tours
    getTours, getTourById, createTour, updateTour, deleteTour, setTourTrending,
    getTourDepartures, createTourDeparture, updateTourDeparture, deleteTourDeparture,
    addTourImages, updateTourImageOrder, deleteTourImage,
    // hotels
    getHotels, getHotelById, createHotel, updateHotel, deleteHotel, setHotelTrending,
    addHotelImages, updateHotelImageOrder, deleteHotelImage,
    // planes
    getPlanes, getPlaneById, createPlane, updatePlane, deletePlane,
    // flights
    getFlights, getFlightById, createFlight, updateFlight, deleteFlight,
    // bookings
    getBookings, getBookingById, getBookingsByUser, deleteBooking,
    // payments
    getPayments, getPaymentById, getPaymentsByBooking, updatePaymentStatus,
    // reviews
    getReviews, deleteReview,
    // dashboard
    getDashboardStats, getRevenueStats, getTopItems,
};
