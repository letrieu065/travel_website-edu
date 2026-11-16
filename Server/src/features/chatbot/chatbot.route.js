"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbot_controller_1 = __importDefault(require("./chatbot.controller"));
const router = express_1.default.Router();
router.post('/message', chatbot_controller_1.default.sendMessage);
router.get('/faqs', chatbot_controller_1.default.getFaqs);
router.get('/history/:sessionId', chatbot_controller_1.default.getChatHistory);
router.post('/support-ticket', chatbot_controller_1.default.createSupportTicket);
exports.default = router;
// Gắn vào index.ts:
// import chatbotRoute from './features/chatbot/chatbot.route';
// app.use('/api/v1/chatbot', chatbotRoute);
//# sourceMappingURL=chatbot.route.js.map