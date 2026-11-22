// src/config/prisma.ts
import env from './env';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = env.DIRECT_URL || env.DATABASE_URL;
export const pool = new Pool({ 
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Lỗi bất ngờ trong pool kết nối cơ sở dữ liệu:', err);
});

const adapter = new PrismaPg(pool);

// Đảm bảo chỉ có DUY NHẤT MỘT bản sao PrismaClient được tạo ra trong toàn bộ ứng dụng
const prisma = new PrismaClient({ adapter });

export default prisma;
