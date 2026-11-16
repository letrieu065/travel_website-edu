import { Request, Response } from 'express';
declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getFaqs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getChatHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createSupportTicket: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    sendMessage: typeof sendMessage;
    getFaqs: typeof getFaqs;
    getChatHistory: typeof getChatHistory;
    createSupportTicket: typeof createSupportTicket;
};
export default _default;
