import express from 'express';
import loansController from './loans.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/calculate', loansController.calculateInstallment);
router.post('/apply', authenticate, loansController.applyTravelLoan);
router.get('/my-loans', authenticate, loansController.getMyLoans);
router.get('/:id', authenticate, loansController.getLoanById);

export default router;

// Gắn vào index.ts:
// import loansRoute from './features/loans/loans.route';
// app.use('/api/v1/loans', loansRoute);
