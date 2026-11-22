import prisma from '../../config/prisma';

/* ============================== TYPES ============================== */

export interface ChatMessageInput {
    session_id: string;
    user_id?: string;
    message: string;
}

export interface SupportTicketInput {
    user_id?: string;
    full_name: string;
    email: string;
    phone_number?: string;
    subject: string;
    content: string;
}

const DEFAULT_FAQS = [
    {
        id: 'faq_1',
        question: 'Tôi có thể thanh toán bằng những phương thức nào?',
        answer: 'Natura Travel hỗ trợ thanh toán qua Ví điện tử MoMo, Chuyển khoản Ngân hàng (VietQR / Internet Banking) và hỗ trợ hồ sơ vay/trả góp du lịch.',
    },
    {
        id: 'faq_2',
        question: 'Chính sách hủy hoặc đổi lịch tour như thế nào?',
        answer: 'Bạn có thể hủy hoặc đổi lịch trực tiếp tại mục Quản lý hành trình. Nếu mua kèm Bảo hiểm hủy chuyến, bạn sẽ được hoàn tới 100% chi phí theo điều khoản.',
    },
    {
        id: 'faq_3',
        question: 'Đặt Combo Tour + Khách sạn + Vé máy bay có ưu đãi gì không?',
        answer: 'Khi đặt Combo trọn gói tại Natura Travel, hệ thống sẽ tự động áp dụng mức ưu đãi giảm từ 10% - 15% so với đặt lẻ từng dịch vụ.',
    },
    {
        id: 'faq_4',
        question: 'Làm sao để nhận hóa đơn và lịch trình sau khi đặt?',
        answer: 'Ngay sau khi thanh toán thành công, hệ thống sẽ tự động gửi email xác nhận kèm mã đặt chỗ và lịch trình chi tiết về địa chỉ email của bạn.',
    },
];

const sendMessage = async (input: ChatMessageInput) => {
    // Lưu tin nhắn người dùng vào PostgreSQL
    await prisma.chat_history.create({
        data: {
            session_id: input.session_id,
            user_id: input.user_id,
            role: 'user',
            content: input.message,
        },
    });

    const lower = input.message.toLowerCase();
    let botReply =
        'Xin chào! Tôi là trợ lý ảo Natura Travel. Tôi có thể tư vấn tour, khách sạn, vé máy bay, combo ưu đãi hoặc giải đáp về thanh toán và bảo hiểm cho bạn.';
    let suggestedTours: any[] = [];

    if (lower.includes('tour') || lower.includes('du lịch') || lower.includes('đi chơi')) {
        suggestedTours = await prisma.tours.findMany({
            where: { is_trending: true },
            take: 3,
            select: { id: true, title: true, destination: true, duration: true },
        });
        botReply =
            'Hiện tại Natura Travel đang có nhiều tour nổi bật và ưu đãi hấp dẫn. Bạn có thể tham khảo các tour gợi ý bên dưới hoặc dùng tính năng AI Sinh lịch trình nhé!';
    } else if (lower.includes('thanh toán') || lower.includes('momo') || lower.includes('chuyển khoản')) {
        botReply = DEFAULT_FAQS[0].answer;
    } else if (lower.includes('hủy') || lower.includes('hoàn') || lower.includes('đổi lịch')) {
        botReply = DEFAULT_FAQS[1].answer;
    } else if (lower.includes('combo')) {
        botReply = DEFAULT_FAQS[2].answer;
    } else if (lower.includes('vay') || lower.includes('trả góp')) {
        botReply =
            'Natura Travel có hỗ trợ gói Vay đi du lịch / trả góp linh hoạt. Bạn có thể đăng ký hồ sơ ngay ở bước thanh toán hoặc mục Hỗ trợ tài chính.';
    }

    // Lưu phản hồi bot vào PostgreSQL
    const botRecord = await prisma.chat_history.create({
        data: {
            session_id: input.session_id,
            user_id: input.user_id,
            role: 'bot',
            content: botReply,
        },
    });

    return {
        session_id: input.session_id,
        reply: botReply,
        suggested_tours: suggestedTours,
        timestamp: botRecord.created_at ? botRecord.created_at.toISOString() : new Date().toISOString(),
    };
};

const getFaqs = async () => {
    return DEFAULT_FAQS;
};

const getChatHistory = async (sessionId: string) => {
    if (!sessionId || sessionId === 'default_session') return [];

    const records = await prisma.chat_history.findMany({
        where: { session_id: sessionId },
        orderBy: { created_at: 'asc' },
    });

    return records.map((r) => ({
        role: r.role as 'user' | 'bot',
        message: r.content,
        timestamp: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
};

const createSupportTicket = async (input: SupportTicketInput) => {
    return prisma.support_tickets.create({
        data: {
            user_id: input.user_id,
            full_name: input.full_name,
            email: input.email,
            phone_number: input.phone_number,
            subject: input.subject,
            content: input.content,
            status: 'open',
        },
    });
};

export default {
    sendMessage,
    getFaqs,
    getChatHistory,
    createSupportTicket,
};

