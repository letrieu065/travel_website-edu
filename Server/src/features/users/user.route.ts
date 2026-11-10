import express from 'express';
import userController from './user.controller';
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

// router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.patch('/change-password', userController.changePassword);

// Quản lý hành trình sắp diễn ra + lịch sử
router.get('/itinerary', userController.getMyItinerary);
router.get('/itinerary/:bookingId', userController.getItineraryDetail);

// Danh sách yêu thích
router.get('/favorites', userController.getFavorites);
router.post('/favorites', userController.addFavorite);
router.delete('/favorites/:itemType/:itemId', userController.removeFavorite);

export default router;

// Gắn vào index.ts:
// import userRoute from './features/users/user.route';
// app.use('/api/v1/users', userRoute);

