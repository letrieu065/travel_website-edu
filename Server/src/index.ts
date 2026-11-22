import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authenticate, requireAdmin, optionalAuthenticate } from './middleware/auth.middleware';

import authRoute from './features/auth/auth.route';
import adminRoute from './features/admin/admin.route';
import userRoute from './features/users/user.route';
import toursRoute from './features/tours/tours.route';
import hotelsRoute from './features/hotels/hotels.route';
import flightsRoute from './features/flights/flights.route';
import combosRoute from './features/combos/combos.route';
import bookingsRoute from './features/bookings/bookings.route';
import paymentsRoute from './features/payments/payments.route';
import reviewsRoute from './features/reviews/reviews.route';
import aiRoute from './features/ai/ai.route';
import chatbotRoute from './features/chatbot/chatbot.route';
import insurancesRoute from './features/insurances/insurances.route';
import loansRoute from './features/loans/loans.route';
import notificationsRoute from './features/notifications/notifications.route';
import restaurantsRoute from './features/restaurants/restaurants.route';

const app: Express = express();

// 1. Cài đặt Global Middlewares
app.use(helmet()); // Bảo mật HTTP headers

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

const isAllowedOrigin = (origin: string): boolean => {
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

app.use(
  cors({
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
  })
);

app.use(express.json()); // Parse body JSON

// 2. Gắn kết các Routes (API Endpoints - v1)
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', authenticate, requireAdmin, adminRoute);
app.use('/api/v1/users', authenticate, userRoute);
app.use('/api/v1/tours', toursRoute);
app.use('/api/v1/hotels', hotelsRoute);
app.use('/api/v1/flights', flightsRoute);
app.use('/api/v1/combos', combosRoute);
app.use('/api/v1/bookings', authenticate, bookingsRoute);
app.use('/api/v1/payments', paymentsRoute);
app.use('/api/v1/reviews', reviewsRoute);
app.use('/api/v1/ai', optionalAuthenticate, aiRoute);
app.use('/api/v1/chatbot', optionalAuthenticate, chatbotRoute);
app.use('/api/v1/insurances', insurancesRoute);
app.use('/api/v1/loans', loansRoute);
app.use('/api/v1/notifications', notificationsRoute);
app.use('/api/v1/restaurants', restaurantsRoute);

// Alias tương thích cho các lời gọi API chưa có /v1 ở Client hiện tại (HomePage.tsx & UserLayout.tsx)
app.use('/api/tours', toursRoute);
app.use('/api/users', authenticate, userRoute);

// Một route cơ bản để kiểm tra "sức khỏe" của server
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Hệ thống hoạt động bình thường.' });
});

// 3. Global Error Handler (Middleware xử lý lỗi chung)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ status: 'error', message: 'Blocked by CORS policy' });
  }
  console.error(err.stack);
  const message = process.env.NODE_ENV === 'production'
    ? 'Đã có sự cố xảy ra trên hệ thống, vui lòng thử lại sau'
    : (err.message || 'Đã có lỗi xảy ra trên server!');
  res.status(500).json({ status: 'error', message });
});

export default app;
