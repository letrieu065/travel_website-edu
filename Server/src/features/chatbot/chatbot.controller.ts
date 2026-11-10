import { Request, Response } from 'express';
import chatbotService from './chatbot.service';

// (Đã thêm)
const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Đã có lỗi xảy ra') => {
    console.error(defaultMessage, error);
    return res.status(500).json({ status: 'error', message: error.message || defaultMessage });
};

// (Đã thêm)
const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || '';
    return param || '';
};

/* ============================== CONTROLLERS ============================== */

// body: { session_id, user_id, message }
const sendMessage = async (req: Request, res: Response) => {
    try {
        const { session_id = 'default_session', user_id, message } = req.body;
        if (!message) {
            return res.status(400).json({ status: 'error', message: 'Nội dung tin nhắn không được để trống' });
        }
        const result = await chatbotService.sendMessage({ session_id, user_id, message });
        return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi xử lý tin nhắn chatbot');
    }
};

const getFaqs = async (req: Request, res: Response) => {
    try {
        const faqs = await chatbotService.getFaqs();
        return res.status(200).json({ status: 'success', faqs });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy danh sách câu hỏi thường gặp');
    }
};

// params: sessionId
const getChatHistory = async (req: Request, res: Response) => {
    try {
        const sessionId = getParam(req.params.sessionId);
        const history = await chatbotService.getChatHistory(sessionId);
        return res.status(200).json({ status: 'success', history });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi lấy lịch sử trò chuyện');
    }
};

// body: SupportTicketInput
const createSupportTicket = async (req: Request, res: Response) => {
    try {
        const { full_name, email, subject, content } = req.body;
        if (!full_name || !email || !subject || !content) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung hỗ trợ',
            });
        }
        const ticket = await chatbotService.createSupportTicket(req.body);
        return res.status(201).json({ status: 'success', message: 'Đã gửi yêu cầu hỗ trợ thành công', ticket });
    } catch (error) {
        return handleControllerError(res, error, 'Lỗi khi gửi yêu cầu hỗ trợ');
    }
};

export default {
    sendMessage,
    getFaqs,
    getChatHistory,
    createSupportTicket,
};

