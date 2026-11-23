import { Request, Response } from 'express';
declare const getHandbooks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHandbookById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    getHandbooks: typeof getHandbooks;
    getHandbookById: typeof getHandbookById;
};
export default _default;
