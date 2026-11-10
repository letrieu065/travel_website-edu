import express from 'express';
import hotelsController from './hotels.controller';

const router = express.Router();

router.get('/trending', hotelsController.getTrendingHotels);
router.get('/top', hotelsController.getTopHotels);

router.get('/', hotelsController.getHotels);
router.get('/:id', hotelsController.getHotelById);
router.get('/:id/availability', hotelsController.checkRoomAvailability);

export default router;

// Gắn vào index.ts:
// import hotelsRoute from './features/hotels/hotels.route';
// app.use('/api/v1/hotels', hotelsRoute);

