import express from 'express';
import restaurantsController from './restaurants.controller';

const router = express.Router();

router.get('/top', restaurantsController.getTopRestaurants);
router.get('/', restaurantsController.getRestaurants);
router.get('/:id', restaurantsController.getRestaurantById);

export default router;

// Gắn vào index.ts:
// import restaurantsRoute from './features/restaurants/restaurants.route';
// app.use('/api/v1/restaurants', restaurantsRoute);

