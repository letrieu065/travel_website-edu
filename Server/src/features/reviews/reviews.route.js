"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviews_controller_1 = __importDefault(require("./reviews.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/top', reviews_controller_1.default.getTopReviews);
router.get('/:itemType/:itemId', reviews_controller_1.default.getReviewsByItem);
router.post('/', auth_middleware_1.authenticate, reviews_controller_1.default.createReview);
router.delete('/:itemType/:itemId', auth_middleware_1.authenticate, reviews_controller_1.default.deleteMyReview);
exports.default = router;
// Gắn vào index.ts:
// import reviewsRoute from './features/reviews/reviews.route';
// app.use('/api/v1/reviews', reviewsRoute);
//# sourceMappingURL=reviews.route.js.map