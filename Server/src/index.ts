import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoute from './features/auth/auth.route';
// import userRoute from './features/users/user.route';

const app: Express = express();

// 1. Cài đặt Global Middlewares
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors()); // Cấu hình CORS
app.use(express.json()); // Parse body JSON

// 2. Gắn kết các Routes (API Endpoints)
app.use('/api/v1/auth', authRoute);
// app.use('/api/v1/users', userRoute);

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