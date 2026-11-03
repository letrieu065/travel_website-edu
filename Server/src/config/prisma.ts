// src/config/prisma.ts
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);

// Đảm bảo chỉ có DUY NHẤT MỘT bản sao PrismaClient được tạo ra trong toàn bộ ứng dụng
const prisma = new PrismaClient({ adapter });

export default prisma;