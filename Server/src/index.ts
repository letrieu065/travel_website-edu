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
app.use(cors()); // Cấu hình CORS
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
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Đã có lỗi xảy ra trên server!' });
});

export default app;
