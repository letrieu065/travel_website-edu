import express from 'express';
import flightsController from './flights.controller';

const router = express.Router();

router.get('/airlines', flightsController.getAirlines);
router.get('/airports', flightsController.getAirports);

router.get('/', flightsController.getFlights);
router.get('/:id', flightsController.getFlightById);

export default router;

// Gắn vào index.ts:
// import flightsRoute from './features/flights/flights.route';
// app.use('/api/v1/flights', flightsRoute);

