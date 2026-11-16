"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const flights_controller_1 = __importDefault(require("./flights.controller"));
const router = express_1.default.Router();
router.get('/airlines', flights_controller_1.default.getAirlines);
router.get('/airports', flights_controller_1.default.getAirports);
router.get('/', flights_controller_1.default.getFlights);
router.get('/:id', flights_controller_1.default.getFlightById);
exports.default = router;
// Gắn vào index.ts:
// import flightsRoute from './features/flights/flights.route';
// app.use('/api/v1/flights', flightsRoute);
//# sourceMappingURL=flights.route.js.map