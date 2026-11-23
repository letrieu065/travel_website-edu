"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const auth_route_1 = __importDefault(require("./features/auth/auth.route"));
const admin_route_1 = __importDefault(require("./features/admin/admin.route"));
const user_route_1 = __importDefault(require("./features/users/user.route"));
const tours_route_1 = __importDefault(require("./features/tours/tours.route"));
const hotels_route_1 = __importDefault(require("./features/hotels/hotels.route"));
const flights_route_1 = __importDefault(require("./features/flights/flights.route"));
const combos_route_1 = __importDefault(require("./features/combos/combos.route"));
const bookings_route_1 = __importDefault(require("./features/bookings/bookings.route"));
const payments_route_1 = __importDefault(require("./features/payments/payments.route"));
const reviews_route_1 = __importDefault(require("./features/reviews/reviews.route"));
const ai_route_1 = __importDefault(require("./features/ai/ai.route"));
const chatbot_route_1 = __importDefault(require("./features/chatbot/chatbot.route"));
const insurances_route_1 = __importDefault(require("./features/insurances/insurances.route"));
const loans_route_1 = __importDefault(require("./features/loans/loans.route"));
const notifications_route_1 = __importDefault(require("./features/notifications/notifications.route"));
const restaurants_route_1 = __importDefault(require("./features/restaurants/restaurants.route"));
const handbook_route_1 = __importDefault(require("./features/handbook/handbook.route"));
const app = (0, express_1.default)();
// 1. Cài đặt Global Middlewares
app.use((0, helmet_1.default)()); // Bảo mật HTTP headers
// Cấu hình CORS nghiêm ngặt theo Whitelist Domain
const clientUrls = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
const allowedOrigins = [
    ...clientUrls,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
];
const isAllowedOrigin = (origin) => {
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
        return true;
    }
    // Cho phép tất cả các cổng localhost / 127.0.0.1 khi ở môi trường development
    if (process.env.NODE_ENV !== 'production') {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
            return true;
        }
    }
    return false;
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Cho phép requests không có origin (mobile apps, server-to-server, curl) hoặc origin nằm trong whitelist
        if (!origin || isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'x-webhook-secret'],
}));
app.use(express_1.default.json()); // Parse body JSON
// 2. Gắn kết các Routes (API Endpoints - v1)
app.use('/api/v1/auth', auth_route_1.default);
app.use('/api/v1/admin', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, admin_route_1.default);
app.use('/api/v1/users', auth_middleware_1.authenticate, user_route_1.default);
app.use('/api/v1/tours', tours_route_1.default);
app.use('/api/v1/hotels', hotels_route_1.default);
app.use('/api/v1/flights', flights_route_1.default);
app.use('/api/v1/combos', combos_route_1.default);
app.use('/api/v1/bookings', auth_middleware_1.authenticate, bookings_route_1.default);
app.use('/api/v1/payments', payments_route_1.default);
app.use('/api/v1/reviews', reviews_route_1.default);
app.use('/api/v1/ai', auth_middleware_1.optionalAuthenticate, ai_route_1.default);
app.use('/api/v1/chatbot', auth_middleware_1.optionalAuthenticate, chatbot_route_1.default);
app.use('/api/v1/insurances', insurances_route_1.default);
app.use('/api/v1/loans', loans_route_1.default);
app.use('/api/v1/notifications', notifications_route_1.default);
app.use('/api/v1/restaurants', restaurants_route_1.default);
app.use('/api/v1/handbook', handbook_route_1.default);
app.use('/api/v1/handbooks', handbook_route_1.default);
// Alias tương thích cho các lời gọi API chưa có /v1 ở Client hiện tại (HomePage.tsx & UserLayout.tsx)
app.use('/api/tours', tours_route_1.default);
app.use('/api/users', auth_middleware_1.authenticate, user_route_1.default);
// Một route cơ bản để kiểm tra "sức khỏe" của server
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Hệ thống hoạt động bình thường.' });
});
// 3. Global Error Handler (Middleware xử lý lỗi chung)
app.use((err, req, res, next) => {
    if (err.message === 'Blocked by CORS policy') {
        return res.status(403).json({ status: 'error', message: 'Blocked by CORS policy' });
    }
    console.error(err.stack);
    const message = process.env.NODE_ENV === 'production'
        ? 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau'
        : (err.message || 'Đã có lỗi xảy ra trên server!');
    res.status(500).json({ status: 'error', message });
});
exports.default = app;
//# sourceMappingURL=index.js.map