import express from 'express';
import adminController from './admin.controller';
// TODO: tạo middleware xác thực JWT + kiểm tra role admin
// import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = express.Router();

// router.use(authenticate, requireAdmin); // áp dụng cho toàn bộ route admin

/* ============================== DASHBOARD ============================== */
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/revenue', adminController.getRevenueStats);
router.get('/dashboard/top-items', adminController.getTopItems);

/* ============================== USERS ============================== */
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:userId/bookings', adminController.getBookingsByUser);

/* ============================== TOURS ============================== */
router.get('/tours', adminController.getTours);
router.get('/tours/:id', adminController.getTourById);
router.post('/tours', adminController.createTour);
router.put('/tours/:id', adminController.updateTour);
router.delete('/tours/:id', adminController.deleteTour);
router.patch('/tours/:id/trending', adminController.setTourTrending);

router.get('/tours/:tourId/departures', adminController.getTourDepartures);
router.post('/tours/:tourId/departures', adminController.createTourDeparture);
router.put('/tour-departures/:departureId', adminController.updateTourDeparture);
router.delete('/tour-departures/:departureId', adminController.deleteTourDeparture);

router.post('/tours/:tourId/images', adminController.addTourImages);
router.patch('/tours/:tourId/images/order', adminController.updateTourImageOrder);
router.delete('/tour-images/:imageId', adminController.deleteTourImage);

/* ============================== HOTELS ============================== */
router.get('/hotels', adminController.getHotels);
router.get('/hotels/:id', adminController.getHotelById);
router.post('/hotels', adminController.createHotel);
router.put('/hotels/:id', adminController.updateHotel);
router.delete('/hotels/:id', adminController.deleteHotel);
router.patch('/hotels/:id/trending', adminController.setHotelTrending);

router.post('/hotels/:hotelId/images', adminController.addHotelImages);
router.patch('/hotels/:hotelId/images/order', adminController.updateHotelImageOrder);
router.delete('/hotel-images/:imageId', adminController.deleteHotelImage);

/* ============================== PLANES ============================== */
router.get('/planes', adminController.getPlanes);
router.get('/planes/:id', adminController.getPlaneById);
router.post('/planes', adminController.createPlane);
router.put('/planes/:id', adminController.updatePlane);
router.delete('/planes/:id', adminController.deletePlane);

/* ============================== FLIGHTS ============================== */
router.get('/flights', adminController.getFlights);
router.get('/flights/:id', adminController.getFlightById);
router.post('/flights', adminController.createFlight);
router.put('/flights/:id', adminController.updateFlight);
router.delete('/flights/:id', adminController.deleteFlight);

/* ============================== BOOKINGS ============================== */
router.get('/bookings', adminController.getBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.delete('/bookings/:id', adminController.deleteBooking);
router.get('/bookings/:bookingId/payments', adminController.getPaymentsByBooking);

/* ============================== PAYMENTS ============================== */
router.get('/payments', adminController.getPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.patch('/payments/:id/status', adminController.updatePaymentStatus);

/* ============================== REVIEWS ============================== */
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:userId/:itemType/:itemId', adminController.deleteReview);

export default router;

// Gắn vào index.ts:
// import adminRoute from './features/admin/admin.route';
// app.use('/api/v1/admin', adminRoute);