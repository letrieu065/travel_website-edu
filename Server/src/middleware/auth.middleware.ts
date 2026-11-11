import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface AuthUserPayload {
    id: string;
    email: string;
    role: string | null;
    full_name: string;
}

export interface AuthRequest extends Request {
    user?: AuthUserPayload;
}

// (Đã thêm)
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Vui lòng đăng nhập để tiếp tục (thiếu token xác thực)',
            });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default_secret_key';

        const decoded: any = jwt.verify(token, secret);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Token không hợp lệ',
            });
        }

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                full_name: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Tài khoản không tồn tại hoặc đã bị khóa',
            });
        }

        req.user = user;
        return next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
            });
        }
        return res.status(401).json({
            status: 'error',
            message: 'Xác thực token thất bại',
        });
    }
};

// (Đã thêm)
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({
            status: 'error',
            message: 'Chưa xác thực người dùng',
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Bạn không có quyền truy cập tài nguyên quản trị (yêu cầu quyền Admin)',
        });
    }

    return next();
};

// (Đã thêm)
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default_secret_key';
        const decoded: any = jwt.verify(token, secret);
        const userId = decoded.userId || decoded.id;

        if (userId) {
            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true, full_name: true },
            });
            if (user) {
                req.user = user;
            }
        }
    } catch {
        // Bỏ qua lỗi token cho chế độ optional
    }
    return next();
};

