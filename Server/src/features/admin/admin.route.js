"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = __importDefault(require("./admin.controller"));
// TODO: tạo middleware xác thực JWT + kiểm tra role admin
// import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
const router = express_1.default.Router();
// router.use(authenticate, requireAdmin); // áp dụng cho toàn bộ route admin
/* ============================== DASHBOARD ============================== */
router.get('/dashboard/stats', admin_controller_1.default.getDashboardStats);
router.get('/dashboard/revenue', admin_controller_1.default.getRevenueStats);
router.get('/dashboard/top-items', admin_controller_1.default.getTopItems);
/* ============================== USERS ============================== */
router.get('/users', admin_controller_1.default.getUsers);
router.get('/users/:id', admin_controller_1.default.getUserById);
router.post('/users', admin_controller_1.default.createUser);
router.put('/users/:id', admin_controller_1.default.updateUser);
router.patch('/users/:id/role', admin_controller_1.default.updateUserRole);
router.post('/users/:id/reset-password', admin_controller_1.default.resetUserPassword);
router.delete('/users/:id', admin_controller_1.default.deleteUser);
router.get('/users/:userId/bookings', admin_controller_1.default.getBookingsByUser);
/* ============================== TOURS ============================== */
router.get('/tours', admin_controller_1.default.getTours);
router.get('/tours/:id', admin_controller_1.default.getTourById);
router.post('/tours', admin_controller_1.default.createTour);
router.put('/tours/:id', admin_controller_1.default.updateTour);
router.delete('/tours/:id', admin_controller_1.default.deleteTour);
router.patch('/tours/:id/trending', admin_controller_1.default.setTourTrending);
router.get('/tours/:tourId/departures', admin_controller_1.default.getTourDepartures);
router.post('/tours/:tourId/departures', admin_controller_1.default.createTourDeparture);
router.put('/tour-departures/:departureId', admin_controller_1.default.updateTourDeparture);
router.delete('/tour-departures/:departureId', admin_controller_1.default.deleteTourDeparture);
router.post('/tours/:tourId/images', admin_controller_1.default.addTourImages);
router.patch('/tours/:tourId/images/order', admin_controller_1.default.updateTourImageOrder);
router.delete('/tour-images/:imageId', admin_controller_1.default.deleteTourImage);
/* ============================== HOTELS ============================== */
router.get('/hotels', admin_controller_1.default.getHotels);
router.get('/hotels/:id', admin_controller_1.default.getHotelById);
router.post('/hotels', admin_controller_1.default.createHotel);
router.put('/hotels/:id', admin_controller_1.default.updateHotel);
router.delete('/hotels/:id', admin_controller_1.default.deleteHotel);
router.patch('/hotels/:id/trending', admin_controller_1.default.setHotelTrending);
router.post('/hotels/:hotelId/images', admin_controller_1.default.addHotelImages);
router.patch('/hotels/:hotelId/images/order', admin_controller_1.default.updateHotelImageOrder);
router.delete('/hotel-images/:imageId', admin_controller_1.default.deleteHotelImage);
/* ============================== PLANES ============================== */
router.get('/planes', admin_controller_1.default.getPlanes);
router.get('/planes/:id', admin_controller_1.default.getPlaneById);
router.post('/planes', admin_controller_1.default.createPlane);
router.put('/planes/:id', admin_controller_1.default.updatePlane);
router.delete('/planes/:id', admin_controller_1.default.deletePlane);
/* ============================== FLIGHTS ============================== */
router.get('/flights', admin_controller_1.default.getFlights);
router.get('/flights/:id', admin_controller_1.default.getFlightById);
router.post('/flights', admin_controller_1.default.createFlight);
router.put('/flights/:id', admin_controller_1.default.updateFlight);
router.delete('/flights/:id', admin_controller_1.default.deleteFlight);
/* ============================== BOOKINGS ============================== */
router.get('/bookings', admin_controller_1.default.getBookings);
router.get('/bookings/:id', admin_controller_1.default.getBookingById);
router.delete('/bookings/:id', admin_controller_1.default.deleteBooking);
router.get('/bookings/:bookingId/payments', admin_controller_1.default.getPaymentsByBooking);
/* ============================== PAYMENTS ============================== */
router.get('/payments', admin_controller_1.default.getPayments);
router.get('/payments/:id', admin_controller_1.default.getPaymentById);
router.patch('/payments/:id/status', admin_controller_1.default.updatePaymentStatus);
/* ============================== REVIEWS ============================== */
router.get('/reviews', admin_controller_1.default.getReviews);
router.delete('/reviews/:userId/:itemType/:itemId', admin_controller_1.default.deleteReview);
exports.default = router;
// Gắn vào index.ts:
// import adminRoute from './features/admin/admin.route';
// app.use('/api/v1/admin', adminRoute);
//# sourceMappingURL=admin.route.js.map