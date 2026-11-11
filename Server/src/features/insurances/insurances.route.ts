import express from 'express';
import insurancesController from './insurances.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/', insurancesController.getPackages);
router.get('/:id', insurancesController.getPackageById);
router.post('/calculate', insurancesController.calculateFee);
router.post('/attach', authenticate, insurancesController.attachInsuranceToBooking);

export default router;

// Gắn vào index.ts:
// import insurancesRoute from './features/insurances/insurances.route';
// app.use('/api/v1/insurances', insurancesRoute);
