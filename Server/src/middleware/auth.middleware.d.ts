import { Request, Response, NextFunction } from 'express';
export interface AuthUserPayload {
    id: string;
    email: string;
    role: string | null;
    full_name: string;
}
export interface AuthRequest extends Request {
    user?: AuthUserPayload;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const optionalAuthenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
