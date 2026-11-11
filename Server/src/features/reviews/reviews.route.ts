import express from 'express';
import reviewsController from './reviews.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/top', reviewsController.getTopReviews);
router.get('/:itemType/:itemId', reviewsController.getReviewsByItem);

router.post('/', authenticate, reviewsController.createReview);
router.delete('/:itemType/:itemId', authenticate, reviewsController.deleteMyReview);

export default router;

// Gắn vào index.ts:
// import reviewsRoute from './features/reviews/reviews.route';
// app.use('/api/v1/reviews', reviewsRoute);
