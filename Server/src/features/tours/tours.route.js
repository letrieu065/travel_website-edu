"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tours_controller_1 = __importDefault(require("./tours.controller"));
const router = express_1.default.Router();
// Các route đặc biệt cho trang chủ (đặt trước /:id để tránh xung đột params)
router.get('/featured', tours_controller_1.default.getFeaturedTours);
router.get('/trending', tours_controller_1.default.getTrendingTours);
router.get('/promotions', tours_controller_1.default.getPromotionTours);
router.get('/top-reviews', tours_controller_1.default.getTopTourReviews);
// Tìm kiếm, lọc, chi tiết tour
router.get('/', tours_controller_1.default.getTours);
router.get('/:id', tours_controller_1.default.getTourById);
router.get('/:id/departures', tours_controller_1.default.getTourDepartures);
exports.default = router;
// Gắn vào index.ts:
// import toursRoute from './features/tours/tours.route';
// app.use('/api/v1/tours', toursRoute);
// (Lưu ý: HomePage.tsx ở Client đang gọi /api/tours/... cần đồng bộ prefix hoặc mount cả hai)
//# sourceMappingURL=tours.route.js.map