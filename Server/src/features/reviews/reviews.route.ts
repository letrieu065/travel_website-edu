import express from 'express';
import reviewsController from './reviews.controller';
// TODO: tạo middleware xác thực JWT cho POST/DELETE review
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/top', reviewsController.getTopReviews);
router.get('/:itemType/:itemId', reviewsController.getReviewsByItem);

router.post('/', reviewsController.createReview);
router.delete('/:itemType/:itemId', reviewsController.deleteMyReview);

export default router;

// Gắn vào index.ts:
// import reviewsRoute from './features/reviews/reviews.route';
// app.use('/api/v1/reviews', reviewsRoute);

