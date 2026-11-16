"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hotels_controller_1 = __importDefault(require("./hotels.controller"));
const router = express_1.default.Router();
router.get('/trending', hotels_controller_1.default.getTrendingHotels);
router.get('/top', hotels_controller_1.default.getTopHotels);
router.get('/', hotels_controller_1.default.getHotels);
router.get('/:id', hotels_controller_1.default.getHotelById);
router.get('/:id/availability', hotels_controller_1.default.checkRoomAvailability);
exports.default = router;
// Gắn vào index.ts:
// import hotelsRoute from './features/hotels/hotels.route';
// app.use('/api/v1/hotels', hotelsRoute);
//# sourceMappingURL=hotels.route.js.map