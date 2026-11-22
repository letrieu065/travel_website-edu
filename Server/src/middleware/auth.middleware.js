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
exports.optionalAuthenticate = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = __importDefault(require("../config/env"));
// (Đã thêm)
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Vui lòng đăng nhập để tiếp tục (thiếu token xác thực)',
            });
        }
        const token = authHeader.split(' ')[1];
        const secret = env_1.default.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'Token không hợp lệ',
            });
        }
        const user = yield prisma_1.default.users.findUnique({
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
    }
    catch (error) {
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
});
exports.authenticate = authenticate;
// (Đã thêm)
const requireAdmin = (req, res, next) => {
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
exports.requireAdmin = requireAdmin;
// (Đã thêm)
const optionalAuthenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        const secret = env_1.default.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const userId = decoded.userId || decoded.id;
        if (userId) {
            const user = yield prisma_1.default.users.findUnique({
                where: { id: userId },
                select: { id: true, email: true, role: true, full_name: true },
            });
            if (user) {
                req.user = user;
            }
        }
    }
    catch (_a) {
        // Bỏ qua lỗi token cho chế độ optional
    }
    return next();
});
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.middleware.js.map