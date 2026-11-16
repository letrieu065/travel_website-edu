import { Request, Response } from 'express';
declare const getMyNotifications: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const markAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const markAllAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const sendEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getContactChannels: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getMyNotifications: typeof getMyNotifications;
    markAsRead: typeof markAsRead;
    markAllAsRead: typeof markAllAsRead;
    sendEmail: typeof sendEmail;
    getContactChannels: typeof getContactChannels;
};
export default _default;
