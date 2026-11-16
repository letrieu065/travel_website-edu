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
const chatbot_service_1 = __importDefault(require("./chatbot.service"));
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
/* ============================== CONTROLLERS ============================== */
// body: { session_id, user_id, message }
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session_id = 'default_session', user_id, message } = req.body;
        if (!message) {
            return res.status(400).json({ status: 'error', message: 'Nội dung tin nhắn không được để trống' });
        }
        const result = yield chatbot_service_1.default.sendMessage({ session_id, user_id, message });
        return res.status(200).json({ status: 'success', data: result });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xử lý tin nhắn chatbot');
    }
});
const getFaqs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const faqs = yield chatbot_service_1.default.getFaqs();
        return res.status(200).json({ status: 'success', faqs });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách câu hỏi thường gặp');
    }
});
// params: sessionId
const getChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessionId = getParam(req.params.sessionId);
        const history = yield chatbot_service_1.default.getChatHistory(sessionId);
        return res.status(200).json({ status: 'success', history });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch sử trò chuyện');
    }
});
// body: SupportTicketInput
const createSupportTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { full_name, email, subject, content } = req.body;
        if (!full_name || !email || !subject || !content) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung hỗ trợ',
            });
        }
        const ticket = yield chatbot_service_1.default.createSupportTicket(req.body);
        return res.status(201).json({ status: 'success', message: 'Đã gửi yêu cầu hỗ trợ thành công', ticket });
    }
    catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi yêu cầu hỗ trợ');
    }
});
exports.default = {
    sendMessage,
    getFaqs,
    getChatHistory,
    createSupportTicket,
};
//# sourceMappingURL=chatbot.controller.js.map