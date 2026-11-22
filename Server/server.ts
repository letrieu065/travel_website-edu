import 'dotenv/config';
import env from './src/config/env';
import app from './src/index';
import prisma, { pool } from './src/config/prisma';

const PORT = env.PORT || process.env.PORT || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Đã kết nối Database PostgreSQL thành công!');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });

    let isShuttingDown = false;
    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang đóng các kết nối an toàn...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          await pool.end();
          console.log('✅ Server đã tắt hoàn toàn.');
          process.exit(0);
        } catch (error) {
          console.error('Lỗi khi đóng kết nối:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
};

startServer();
