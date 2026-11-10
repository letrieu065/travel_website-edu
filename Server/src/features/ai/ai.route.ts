import express from 'express';
import aiController from './ai.controller';

const router = express.Router();

router.post('/generate-itinerary', aiController.generateItinerary);
router.post('/compare-tours', aiController.compareTours);

export default router;

// Gắn vào index.ts:
// import aiRoute from './features/ai/ai.route';
// app.use('/api/v1/ai', aiRoute);

