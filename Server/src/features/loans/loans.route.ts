import express from 'express';
import loansController from './loans.controller';
// TODO: tạo middleware xác thực JWT
// import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/calculate', loansController.calculateInstallment);
router.post('/apply', loansController.applyTravelLoan);
router.get('/my-loans', loansController.getMyLoans);
router.get('/:id', loansController.getLoanById);

export default router;

// Gắn vào index.ts:
// import loansRoute from './features/loans/loans.route';
// app.use('/api/v1/loans', loansRoute);

