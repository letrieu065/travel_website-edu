import express from 'express';
import handbookController from './handbook.controller';

const router = express.Router();

router.get('/', handbookController.getHandbooks);
router.get('/:id', handbookController.getHandbookById);

export default router;
