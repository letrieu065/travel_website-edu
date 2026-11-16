"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/prisma.ts
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
const adapter = new adapter_pg_1.PrismaPg(pool);
// Đảm bảo chỉ có DUY NHẤT MỘT bản sao PrismaClient được tạo ra trong toàn bộ ứng dụng
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
//# sourceMappingURL=prisma.js.map