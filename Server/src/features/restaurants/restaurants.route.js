"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const restaurants_controller_1 = __importDefault(require("./restaurants.controller"));
const router = express_1.default.Router();
router.get('/top', restaurants_controller_1.default.getTopRestaurants);
router.get('/', restaurants_controller_1.default.getRestaurants);
router.get('/:id', restaurants_controller_1.default.getRestaurantById);
exports.default = router;
// Gắn vào index.ts:
// import restaurantsRoute from './features/restaurants/restaurants.route';
// app.use('/api/v1/restaurants', restaurantsRoute);
//# sourceMappingURL=restaurants.route.js.map