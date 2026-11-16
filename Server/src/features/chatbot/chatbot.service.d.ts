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
declare const sendMessage: (input: ChatMessageInput) => Promise<{
    session_id: string;
    reply: string;
    suggested_tours: any[];
    timestamp: string;
}>;
declare const getFaqs: () => Promise<{
    id: string;
    question: string;
    answer: string;
}[]>;
declare const getChatHistory: (sessionId: string) => Promise<{
    role: 'user' | 'bot';
    message: string;
    timestamp: string;
}[]>;
declare const createSupportTicket: (input: SupportTicketInput) => Promise<{
    user_id?: string;
    full_name: string;
    email: string;
    phone_number?: string;
    subject: string;
    content: string;
    id: string;
    status: string;
    created_at: string;
}>;
declare const _default: {
    sendMessage: typeof sendMessage;
    getFaqs: typeof getFaqs;
    getChatHistory: typeof getChatHistory;
    createSupportTicket: typeof createSupportTicket;
};
export default _default;
