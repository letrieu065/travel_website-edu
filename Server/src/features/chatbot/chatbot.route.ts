import express from 'express';
import chatbotController from './chatbot.controller';

const router = express.Router();

router.post('/message', chatbotController.sendMessage);
router.get('/faqs', chatbotController.getFaqs);
router.get('/history/:sessionId', chatbotController.getChatHistory);
router.post('/support-ticket', chatbotController.createSupportTicket);

export default router;

// Gắn vào index.ts:
// import chatbotRoute from './features/chatbot/chatbot.route';
// app.use('/api/v1/chatbot', chatbotRoute);

