import { Request, Response } from 'express';
import adminService from './admin.service';

/*
 * Mỗi handler: validate req (params / query / body) -> gọi service -> trả res.
 * Chú thích sau mỗi hàm cho biết dữ liệu lấy từ đâu trong req.
 */

/* ============================== USERS ============================== */

const getUsers = async (req: Request, res: Response) => { };          // query: page, limit, search, role, auth_provider
const getUserById = async (req: Request, res: Response) => { };       // params: id
const createUser = async (req: Request, res: Response) => { };        // body: UserData
const updateUser = async (req: Request, res: Response) => { };        // params: id | body: Partial<UserData>
const updateUserRole = async (req: Request, res: Response) => { };    // params: id | body: role
const deleteUser = async (req: Request, res: Response) => { };        // params: id

/* ============================== TOURS ============================== */

const getTours = async (req: Request, res: Response) => { };          // query: page, limit, search, tour_type, is_trending
const getTourById = async (req: Request, res: Response) => { };       // params: id
const createTour = async (req: Request, res: Response) => { };        // body: TourData
const updateTour = async (req: Request, res: Response) => { };        // params: id | body: Partial<TourData>
const deleteTour = async (req: Request, res: Response) => { };        // params: id
const setTourTrending = async (req: Request, res: Response) => { };   // params: id | body: is_trending

const getTourDepartures = async (req: Request, res: Response) => { };     // params: tourId
const createTourDeparture = async (req: Request, res: Response) => { };   // params: tourId | body: TourDepartureData
const updateTourDeparture = async (req: Request, res: Response) => { };   // params: departureId | body: Partial<TourDepartureData>
const deleteTourDeparture = async (req: Request, res: Response) => { };   // params: departureId

const addTourImages = async (req: Request, res: Response) => { };         // params: tourId | body: images[]
const updateTourImageOrder = async (req: Request, res: Response) => { };  // params: tourId | body: orders[]
const deleteTourImage = async (req: Request, res: Response) => { };       // params: imageId

/* ============================== HOTELS ============================== */

const getHotels = async (req: Request, res: Response) => { };         // query: page, limit, search, city, star_rating, is_trending
const getHotelById = async (req: Request, res: Response) => { };      // params: id
const createHotel = async (req: Request, res: Response) => { };       // body: HotelData
const updateHotel = async (req: Request, res: Response) => { };       // params: id | body: Partial<HotelData>
const deleteHotel = async (req: Request, res: Response) => { };       // params: id
const setHotelTrending = async (req: Request, res: Response) => { };  // params: id | body: is_trending

const addHotelImages = async (req: Request, res: Response) => { };        // params: hotelId | body: images[]
const updateHotelImageOrder = async (req: Request, res: Response) => { }; // params: hotelId | body: orders[]
const deleteHotelImage = async (req: Request, res: Response) => { };      // params: imageId

/* ============================== PLANES ============================== */

const getPlanes = async (req: Request, res: Response) => { };         // query: page, limit, search
const getPlaneById = async (req: Request, res: Response) => { };      // params: id
const createPlane = async (req: Request, res: Response) => { };       // body: PlaneData
const updatePlane = async (req: Request, res: Response) => { };       // params: id | body: Partial<PlaneData>
const deletePlane = async (req: Request, res: Response) => { };       // params: id

/* ============================== FLIGHTS ============================== */

const getFlights = async (req: Request, res: Response) => { };        // query: page, limit, departure_airport, arrival_airport, from_date, to_date
const getFlightById = async (req: Request, res: Response) => { };     // params: id
const createFlight = async (req: Request, res: Response) => { };      // body: FlightData
const updateFlight = async (req: Request, res: Response) => { };      // params: id | body: Partial<FlightData>
const deleteFlight = async (req: Request, res: Response) => { };      // params: id

/* ============================== BOOKINGS ============================== */

const getBookings = async (req: Request, res: Response) => { };       // query: page, limit, user_id, from_date, to_date
const getBookingById = async (req: Request, res: Response) => { };    // params: id
const getBookingsByUser = async (req: Request, res: Response) => { }; // params: userId | query: page, limit
const deleteBooking = async (req: Request, res: Response) => { };     // params: id

/* ============================== PAYMENTS ============================== */

const getPayments = async (req: Request, res: Response) => { };           // query: page, limit, payment_status, payment_method, from_date, to_date
const getPaymentById = async (req: Request, res: Response) => { };        // params: id
const getPaymentsByBooking = async (req: Request, res: Response) => { };  // params: bookingId
const updatePaymentStatus = async (req: Request, res: Response) => { };   // params: id | body: payment_status

/* ============================== REVIEWS ============================== */

const getReviews = async (req: Request, res: Response) => { };        // query: page, limit, item_type, item_id, rating
const deleteReview = async (req: Request, res: Response) => { };      // params: userId, itemType, itemId

/* ============================== DASHBOARD ============================== */

const getDashboardStats = async (req: Request, res: Response) => { }; // không tham số
const getRevenueStats = async (req: Request, res: Response) => { };   // query: from_date, to_date, group_by
const getTopItems = async (req: Request, res: Response) => { };       // query: item_type, limit, from_date, to_date

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