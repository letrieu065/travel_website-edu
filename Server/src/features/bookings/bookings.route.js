"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookings_controller_1 = __importDefault(require("./bookings.controller"));
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';
const router = express_1.default.Router();
// router.use(authenticate);
router.post('/', bookings_controller_1.default.createBooking);
router.get('/my-bookings', bookings_controller_1.default.getMyBookings);
router.get('/:id', bookings_controller_1.default.getBookingById);
router.patch('/:id/cancel', bookings_controller_1.default.cancelBooking);
exports.default = router;
// Gắn vào index.ts:
// import bookingsRoute from './features/bookings/bookings.route';
// app.use('/api/v1/bookings', bookingsRoute);
//# sourceMappingURL=bookings.route.js.map