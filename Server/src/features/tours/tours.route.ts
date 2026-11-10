import express from 'express';
import toursController from './tours.controller';

const router = express.Router();

// Các route đặc biệt cho trang chủ (đặt trước /:id để tránh xung đột params)
router.get('/featured', toursController.getFeaturedTours);
router.get('/trending', toursController.getTrendingTours);
router.get('/promotions', toursController.getPromotionTours);
router.get('/top-reviews', toursController.getTopTourReviews);

// Tìm kiếm, lọc, chi tiết tour
router.get('/', toursController.getTours);
router.get('/:id', toursController.getTourById);
router.get('/:id/departures', toursController.getTourDepartures);

export default router;

// Gắn vào index.ts:
// import toursRoute from './features/tours/tours.route';
// app.use('/api/v1/tours', toursRoute);
// (Lưu ý: HomePage.tsx ở Client đang gọi /api/tours/... cần đồng bộ prefix hoặc mount cả hai)

