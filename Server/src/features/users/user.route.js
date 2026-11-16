"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = __importDefault(require("./user.controller"));
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';
const router = express_1.default.Router();
// router.use(authenticate);
router.get('/profile', user_controller_1.default.getProfile);
router.put('/profile', user_controller_1.default.updateProfile);
router.patch('/change-password', user_controller_1.default.changePassword);
// Quản lý hành trình sắp diễn ra + lịch sử
router.get('/itinerary', user_controller_1.default.getMyItinerary);
router.get('/itinerary/:bookingId', user_controller_1.default.getItineraryDetail);
// Danh sách yêu thích
router.get('/favorites', user_controller_1.default.getFavorites);
router.post('/favorites', user_controller_1.default.addFavorite);
router.delete('/favorites/:itemType/:itemId', user_controller_1.default.removeFavorite);
exports.default = router;
// Gắn vào index.ts:
// import userRoute from './features/users/user.route';
// app.use('/api/v1/users', userRoute);
//# sourceMappingURL=user.route.js.map