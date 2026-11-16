"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const notifications_service_1 = __importDefault(require("./notifications.service"));
// (Đã thêm)
const handleControllerError = (res, error, defaultMessage = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};
// (Đã thêm)
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0] || '';
    return param || '';
};
// (Đã thêm)
const extractUserId = (req) => {
    var _a;
    const reqUser = req.user;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.userId)
        return reqUser.userId;
    if (reqUser === null || reqUser === void 0 ? void 0 : reqUser.id)
        return reqUser.id;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'default_secret_key';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded.userId || decoded.id || '';
        }
        catch (_b) {
            return '';
        }
    }
    return req.query.user_id || ((_a = req.body) === null || _a === void 0 ? void 0 : _a.user_id) || '';
};
/* ============================== CONTROLLERS ============================== */
const getMyNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const notifications = yield notifications_service_1.default.getMyNotifications(userId);
        return res.status(200).json({ status: 'success', notifications });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách thông báo');
    }
});
// params: id
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        const id = getParam(req.params.id);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const item = yield notifications_service_1.default.markAsRead(userId, id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông báo' });
        }
        return res.status(200).json({ status: 'success', notification: item });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đánh dấu đã đọc');
    }
});
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = extractUserId(req);
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Chưa xác thực người dùng' });
        }
        const result = yield notifications_service_1.default.markAllAsRead(userId);
        return res.status(200).json(Object.assign({ status: 'success' }, result));
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi đánh dấu đọc tất cả thông báo');
    }
});
// body: { to, subject, html }
const sendEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp to, subject và html' });
        }
        const result = yield notifications_service_1.default.sendEmailNotification({ to, subject, html });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi email thông báo');
    }
});
const getContactChannels = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const channels = yield notifications_service_1.default.getContactChannels();
        return res.status(200).json({ status: 'success', channels });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy thông tin kênh liên hệ');
    }
});
exports.default = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    sendEmail,
    getContactChannels,
};
//# sourceMappingURL=notifications.controller.js.map