import express from 'express';
import combosController from './combos.controller';

const router = express.Router();

router.get('/', combosController.getPopularCombos);
router.post('/suggest', combosController.suggestCombo);
router.get('/:tourId', combosController.getComboByTourId);

export default router;

// Gắn vào index.ts:
// import combosRoute from './features/combos/combos.route';
// app.use('/api/v1/combos', combosRoute);

