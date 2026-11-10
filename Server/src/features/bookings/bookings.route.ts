import express from 'express';
import bookingsController from './bookings.controller';
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// router.use(authenticate);

router.post('/', bookingsController.createBooking);
router.get('/my-bookings', bookingsController.getMyBookings);
router.get('/:id', bookingsController.getBookingById);
router.patch('/:id/cancel', bookingsController.cancelBooking);

export default router;

// Gắn vào index.ts:
// import bookingsRoute from './features/bookings/bookings.route';
// app.use('/api/v1/bookings', bookingsRoute);

