"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notifications_controller_1 = __importDefault(require("./notifications.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/contact-channels', notifications_controller_1.default.getContactChannels);
router.get('/', auth_middleware_1.authenticate, notifications_controller_1.default.getMyNotifications);
router.patch('/read-all', auth_middleware_1.authenticate, notifications_controller_1.default.markAllAsRead);
router.patch('/:id/read', auth_middleware_1.authenticate, notifications_controller_1.default.markAsRead);
router.post('/send-email', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, notifications_controller_1.default.sendEmail);
exports.default = router;
// Gắn vào index.ts:
// import notificationsRoute from './features/notifications/notifications.route';
// app.use('/api/v1/notifications', notificationsRoute);
//# sourceMappingURL=notifications.route.js.map