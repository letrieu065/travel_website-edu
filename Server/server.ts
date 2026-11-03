import app from './src/index';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import prisma from './src/config/prisma';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    prisma.$connect()
      .then(() => console.log('Đã kết nối Database PostgreSQL thành công!'))
      .catch((err: Error) => console.error('Lỗi kết nối Database:', err));
    console.log('✅ Kết nối Database thành công.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Đang đóng các kết nối an toàn...');
      server.close(() => {
        console.log('✅ Server đã tắt hoàn toàn.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
};

startServer();