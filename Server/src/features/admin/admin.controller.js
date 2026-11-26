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
const admin_service_1 = __importDefault(require("./admin.service"));
// (Đã thêm)
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    const isProd = process.env.NODE_ENV === 'production';
    return res.status(500).json({
        status: 'error',
        message: isProd ? 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau' : (error.message || defaultMessage),
    });
};
// (Đã thêm)
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
/* ============================== USERS ============================== */
// query: page, limit, search, role, auth_provider
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search, role, auth_provider } = req.query;
        const result = yield admin_service_1.default.getUsers({
            page: Number(page),
            limit: Number(limit),
            search: search,
            role: role,
            auth_provider: auth_provider,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách người dùng');
    }
});
// params: id
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const user = yield admin_service_1.default.getUserById(id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
        }
        return res.status(200).json({ status: 'success', data: user });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin người dùng');
    }
});
// body: UserData
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password, full_name, phone_number, avatar_url, role } = req.body;
        if (!email || !full_name) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ email và họ tên' });
        }
        const newUser = yield admin_service_1.default.createUser({
            email,
            password,
            full_name,
            phone_number,
            avatar_url,
            role,
        });
        return res.status(201).json({ status: 'success', message: 'Tạo người dùng thành công', data: newUser });
    }
    catch (error) {
        if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('Mật khẩu')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Email đã được sử dụng'))) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
        return handleControllerError(res, error, 'Lỗi khi tạo người dùng');
    }
});
// params: id | body: Partial<UserData>
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const updatedUser = yield admin_service_1.default.updateUser(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật người dùng thành công', data: updatedUser });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật người dùng');
    }
});
// params: id | body: role
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Role không hợp lệ (user hoặc admin)' });
        }
        const updatedUser = yield admin_service_1.default.updateUserRole(id, role);
        return res.status(200).json({ status: 'success', message: 'Cập nhật vai trò thành công', data: updatedUser });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật vai trò người dùng');
    }
});
// params: id
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deleteUser(id);
        return res.status(200).json({ status: 'success', message: 'Xóa người dùng thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa người dùng');
    }
});
// (Đã thêm)
// params: id | body: { newPassword?: string }
const resetUserPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = getParam(req.params.id);
        const { newPassword, password } = req.body || {};
        const customPassword = newPassword !== undefined ? newPassword : password;
        const adminName = (_a = req.user) === null || _a === void 0 ? void 0 : _a.full_name;
        const result = yield admin_service_1.default.resetUserPassword(id, {
            newPassword: customPassword,
            adminName,
        });
        return res.status(200).json({
            status: 'success',
            message: `Đã đặt lại mật khẩu và gửi email đến ${result.email}`,
            data: result,
        });
    }
    catch (error) {
        const msg = (error === null || error === void 0 ? void 0 : error.message) || '';
        if (msg.includes('Không thể gửi email')) {
            return res.status(502).json({ status: 'error', message: msg });
        }
        if (msg.includes('chưa cấu hình email')) {
            return res.status(500).json({ status: 'error', message: msg });
        }
        if (msg.includes('ID người dùng không hợp lệ') ||
            msg.includes('Mật khẩu phải có') ||
            msg.includes('chưa có địa chỉ email')) {
            return res.status(400).json({ status: 'error', message: msg });
        }
        if (msg.includes('Không tìm thấy người dùng')) {
            return res.status(404).json({ status: 'error', message: msg });
        }
        return handleControllerError(res, error, 'Lỗi khi đặt lại mật khẩu người dùng');
    }
});
/* ============================== TOURS ============================== */
// query: page, limit, search, tour_type, is_trending
const getTours = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search, tour_type, is_trending } = req.query;
        const result = yield admin_service_1.default.getTours({
            page: Number(page),
            limit: Number(limit),
            search: search,
            tour_type: tour_type,
            is_trending: is_trending !== undefined ? is_trending === 'true' : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách tour');
    }
});
// params: id
const getTourById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const tour = yield admin_service_1.default.getTourById(id);
        if (!tour) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy tour' });
        }
        return res.status(200).json({ status: 'success', data: tour });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết tour');
    }
});
// body: TourData
const createTour = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, tour_type } = req.body;
        if (!title || !tour_type) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp tiêu đề và loại tour' });
        }
        const newTour = yield admin_service_1.default.createTour(req.body);
        return res.status(201).json({ status: 'success', message: 'Tạo tour mới thành công', data: newTour });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo tour');
    }
});
// params: id | body: Partial<TourData>
const updateTour = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const updatedTour = yield admin_service_1.default.updateTour(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật tour thành công', data: updatedTour });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật tour');
    }
});
// params: id
const deleteTour = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deleteTour(id);
        return res.status(200).json({ status: 'success', message: 'Xóa tour thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa tour');
    }
});
// params: id | body: is_trending
const setTourTrending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const { is_trending } = req.body;
        if (typeof is_trending !== 'boolean') {
            return res.status(400).json({ status: 'error', message: 'is_trending phải là giá trị boolean' });
        }
        const updatedTour = yield admin_service_1.default.setTourTrending(id, is_trending);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trạng thái trending thành công', data: updatedTour });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trending cho tour');
    }
});
// params: tourId
const getTourDepartures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tourId = getParam(req.params.tourId);
        const departures = yield admin_service_1.default.getTourDepartures(tourId);
        return res.status(200).json({ status: 'success', data: departures });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch khởi hành của tour');
    }
});
// params: tourId | body: TourDepartureData
const createTourDeparture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tourId = getParam(req.params.tourId);
        const { start_date, price, available_seats } = req.body;
        if (!start_date || price === undefined || available_seats === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp ngày bắt đầu, giá và số chỗ trống' });
        }
        const departure = yield admin_service_1.default.createTourDeparture(tourId, req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm lịch khởi hành thành công', data: departure });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo lịch khởi hành');
    }
});
// params: departureId | body: Partial<TourDepartureData>
const updateTourDeparture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const departureId = getParam(req.params.departureId);
        const updated = yield admin_service_1.default.updateTourDeparture(departureId, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật lịch khởi hành thành công', data: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật lịch khởi hành');
    }
});
// params: departureId
const deleteTourDeparture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const departureId = getParam(req.params.departureId);
        yield admin_service_1.default.deleteTourDeparture(departureId);
        return res.status(200).json({ status: 'success', message: 'Xóa lịch khởi hành thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa lịch khởi hành');
    }
});
// params: tourId | body: images[]
const addTourImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tourId = getParam(req.params.tourId);
        const { images } = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp danh sách ảnh (images array)' });
        }
        const result = yield admin_service_1.default.addTourImages(tourId, images);
        return res.status(201).json({ status: 'success', message: 'Thêm ảnh cho tour thành công', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm ảnh cho tour');
    }
});
// params: tourId | body: orders[]
const updateTourImageOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tourId = getParam(req.params.tourId);
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ status: 'error', message: 'orders phải là danh sách { id, sort_order }' });
        }
        yield admin_service_1.default.updateTourImageOrder(tourId, orders);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thứ tự ảnh thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi sắp xếp ảnh tour');
    }
});
// params: imageId
const deleteTourImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imageId = getParam(req.params.imageId);
        yield admin_service_1.default.deleteTourImage(imageId);
        return res.status(200).json({ status: 'success', message: 'Xóa ảnh tour thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa ảnh tour');
    }
});
/* ============================== HOTELS ============================== */
// query: page, limit, search, city, star_rating, is_trending
const getHotels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search, city, star_rating, is_trending } = req.query;
        const result = yield admin_service_1.default.getHotels({
            page: Number(page),
            limit: Number(limit),
            search: search,
            city: city,
            star_rating: star_rating !== undefined ? Number(star_rating) : undefined,
            is_trending: is_trending !== undefined ? is_trending === 'true' : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách khách sạn');
    }
});
// params: id
const getHotelById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const hotel = yield admin_service_1.default.getHotelById(id);
        if (!hotel) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy khách sạn' });
        }
        return res.status(200).json({ status: 'success', data: hotel });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết khách sạn');
    }
});
// body: HotelData
const createHotel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, city, address, price_per_night, available_rooms } = req.body;
        if (!name || !city || !address || price_per_night === undefined || available_rooms === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ tên, thành phố, địa chỉ, giá và số phòng' });
        }
        const newHotel = yield admin_service_1.default.createHotel(req.body);
        return res.status(201).json({ status: 'success', message: 'Tạo khách sạn thành công', data: newHotel });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo khách sạn');
    }
});
// params: id | body: Partial<HotelData>
const updateHotel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const updatedHotel = yield admin_service_1.default.updateHotel(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật khách sạn thành công', data: updatedHotel });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật khách sạn');
    }
});
// params: id
const deleteHotel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deleteHotel(id);
        return res.status(200).json({ status: 'success', message: 'Xóa khách sạn thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa khách sạn');
    }
});
// params: id | body: is_trending
const setHotelTrending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const { is_trending } = req.body;
        if (typeof is_trending !== 'boolean') {
            return res.status(400).json({ status: 'error', message: 'is_trending phải là giá trị boolean' });
        }
        const updatedHotel = yield admin_service_1.default.setHotelTrending(id, is_trending);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trending cho khách sạn thành công', data: updatedHotel });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trending khách sạn');
    }
});
// params: hotelId | body: images[]
const addHotelImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = getParam(req.params.hotelId);
        const { images } = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp danh sách ảnh (images array)' });
        }
        const result = yield admin_service_1.default.addHotelImages(hotelId, images);
        return res.status(201).json({ status: 'success', message: 'Thêm ảnh khách sạn thành công', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi thêm ảnh khách sạn');
    }
});
// params: hotelId | body: orders[]
const updateHotelImageOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = getParam(req.params.hotelId);
        const { orders } = req.body;
        if (!Array.isArray(orders)) {
            return res.status(400).json({ status: 'error', message: 'orders phải là danh sách { id, sort_order }' });
        }
        yield admin_service_1.default.updateHotelImageOrder(hotelId, orders);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thứ tự ảnh khách sạn thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi sắp xếp ảnh khách sạn');
    }
});
// params: imageId
const deleteHotelImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imageId = getParam(req.params.imageId);
        yield admin_service_1.default.deleteHotelImage(imageId);
        return res.status(200).json({ status: 'success', message: 'Xóa ảnh khách sạn thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa ảnh khách sạn');
    }
});
/* ============================== PLANES ============================== */
// query: page, limit, search
const getPlanes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const result = yield admin_service_1.default.getPlanes({
            page: Number(page),
            limit: Number(limit),
            search: search,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách máy bay');
    }
});
// params: id
const getPlaneById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const plane = yield admin_service_1.default.getPlaneById(id);
        if (!plane) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy máy bay' });
        }
        return res.status(200).json({ status: 'success', data: plane });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin máy bay');
    }
});
// body: PlaneData
const createPlane = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { airline, plane_number, total_seats } = req.body;
        if (!airline || !plane_number || total_seats === undefined) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp hãng bay, số hiệu và tổng số ghế' });
        }
        const newPlane = yield admin_service_1.default.createPlane(req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm máy bay thành công', data: newPlane });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo máy bay');
    }
});
// params: id | body: Partial<PlaneData>
const updatePlane = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const updated = yield admin_service_1.default.updatePlane(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật thông tin máy bay thành công', data: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật máy bay');
    }
});
// params: id
const deletePlane = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deletePlane(id);
        return res.status(200).json({ status: 'success', message: 'Xóa máy bay thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa máy bay');
    }
});
/* ============================== FLIGHTS ============================== */
// query: page, limit, departure_airport, arrival_airport, from_date, to_date
const getFlights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, departure_airport, arrival_airport, from_date, to_date } = req.query;
        const result = yield admin_service_1.default.getFlights({
            page: Number(page),
            limit: Number(limit),
            departure_airport: departure_airport,
            arrival_airport: arrival_airport,
            from_date: from_date,
            to_date: to_date,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách chuyến bay');
    }
});
// params: id
const getFlightById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const flight = yield admin_service_1.default.getFlightById(id);
        if (!flight) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy chuyến bay' });
        }
        return res.status(200).json({ status: 'success', data: flight });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết chuyến bay');
    }
});
// body: FlightData
const createFlight = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { plane_id, departure_time, arrival_time, ticket_price, available_seats, departure_airport, arrival_airport } = req.body;
        if (!plane_id || !departure_time || !arrival_time || ticket_price === undefined || available_seats === undefined || !departure_airport || !arrival_airport) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp đầy đủ thông tin chuyến bay' });
        }
        const newFlight = yield admin_service_1.default.createFlight(req.body);
        return res.status(201).json({ status: 'success', message: 'Thêm chuyến bay thành công', data: newFlight });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi tạo chuyến bay');
    }
});
// params: id | body: Partial<FlightData>
const updateFlight = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const updated = yield admin_service_1.default.updateFlight(id, req.body);
        return res.status(200).json({ status: 'success', message: 'Cập nhật chuyến bay thành công', data: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật chuyến bay');
    }
});
// params: id
const deleteFlight = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deleteFlight(id);
        return res.status(200).json({ status: 'success', message: 'Xóa chuyến bay thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa chuyến bay');
    }
});
/* ============================== BOOKINGS ============================== */
// query: page, limit, user_id, from_date, to_date
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, user_id, from_date, to_date } = req.query;
        const result = yield admin_service_1.default.getBookings({
            page: Number(page),
            limit: Number(limit),
            user_id: user_id,
            from_date: from_date,
            to_date: to_date,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ');
    }
});
// params: id
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const booking = yield admin_service_1.default.getBookingById(id);
        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn đặt chỗ' });
        }
        return res.status(200).json({ status: 'success', data: booking });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết đơn đặt chỗ');
    }
});
// params: userId | query: page, limit
const getBookingsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getParam(req.params.userId);
        const { page = 1, limit = 10 } = req.query;
        const result = yield admin_service_1.default.getBookingsByUser(userId, {
            page: Number(page),
            limit: Number(limit),
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đơn đặt chỗ của người dùng');
    }
});
// params: id
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        yield admin_service_1.default.deleteBooking(id);
        return res.status(200).json({ status: 'success', message: 'Xóa đơn đặt chỗ thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đơn đặt chỗ');
    }
});
/* ============================== PAYMENTS ============================== */
// query: page, limit, payment_status, payment_method, from_date, to_date
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, payment_status, payment_method, from_date, to_date } = req.query;
        const result = yield admin_service_1.default.getPayments({
            page: Number(page),
            limit: Number(limit),
            payment_status: payment_status,
            payment_method: payment_method,
            from_date: from_date,
            to_date: to_date,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách giao dịch');
    }
});
// params: id
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const payment = yield admin_service_1.default.getPaymentById(id);
        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy giao dịch' });
        }
        return res.status(200).json({ status: 'success', data: payment });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy chi tiết giao dịch');
    }
});
// params: bookingId
const getPaymentsByBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = getParam(req.params.bookingId);
        const payments = yield admin_service_1.default.getPaymentsByBooking(bookingId);
        return res.status(200).json({ status: 'success', data: payments });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy giao dịch của đơn đặt chỗ');
    }
});
// params: id | body: payment_status
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = getParam(req.params.id);
        const { payment_status } = req.body;
        const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!payment_status || !validStatuses.includes(payment_status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Trạng thái thanh toán không hợp lệ (pending, paid, failed, refunded)',
            });
        }
        const updated = yield admin_service_1.default.updatePaymentStatus(id, payment_status);
        return res.status(200).json({ status: 'success', message: 'Cập nhật trạng thái thanh toán thành công', data: updated });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi cập nhật trạng thái thanh toán');
    }
});
/* ============================== REVIEWS ============================== */
// query: page, limit, item_type, item_id, rating
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, item_type, item_id, rating } = req.query;
        const result = yield admin_service_1.default.getReviews({
            page: Number(page),
            limit: Number(limit),
            item_type: item_type,
            item_id: item_id,
            rating: rating !== undefined ? Number(rating) : undefined,
        });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách đánh giá');
    }
});
// params: userId, itemType, itemId
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = getParam(req.params.userId);
        const itemType = getParam(req.params.itemType);
        const itemId = getParam(req.params.itemId);
        if (!userId || !itemType || !itemId) {
            return res.status(400).json({ status: 'error', message: 'Thiếu userId, itemType hoặc itemId' });
        }
        yield admin_service_1.default.deleteReview(userId, itemId, itemType);
        return res.status(200).json({ status: 'success', message: 'Xóa đánh giá thành công' });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xóa đánh giá');
    }
});
/* ============================== DASHBOARD ============================== */
// không tham số
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield admin_service_1.default.getDashboardStats();
        return res.status(200).json({ status: 'success', data: stats });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thống kê dashboard');
    }
});
// query: from_date, to_date, group_by
const getRevenueStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { from_date, to_date, group_by = 'day' } = req.query;
        if (!from_date || !to_date) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp from_date và to_date' });
        }
        if (!['day', 'month', 'year'].includes(group_by)) {
            return res.status(400).json({ status: 'error', message: 'group_by chỉ chấp nhận day, month hoặc year' });
        }
        const stats = yield admin_service_1.default.getRevenueStats({
            from_date: from_date,
            to_date: to_date,
            group_by: group_by,
        });
        return res.status(200).json({ status: 'success', data: stats });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thống kê doanh thu');
    }
});
// query: item_type, limit, from_date, to_date
const getTopItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_type, limit = 5, from_date, to_date } = req.query;
        if (!item_type || !['tour', 'hotel', 'flight'].includes(item_type)) {
            return res.status(400).json({ status: 'error', message: 'item_type phải là tour, hotel hoặc flight' });
        }
        const topItems = yield admin_service_1.default.getTopItems({
            item_type: item_type,
            limit: Number(limit),
            from_date: from_date,
            to_date: to_date,
        });
        return res.status(200).json({ status: 'success', data: topItems });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy top dịch vụ được đặt');
    }
});
exports.default = {
    // users
    getUsers, getUserById, createUser, updateUser, updateUserRole, deleteUser, resetUserPassword,
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
//# sourceMappingURL=admin.controller.js.map