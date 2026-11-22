"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
// src/config/prisma.ts
const env_1 = __importDefault(require("./env"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const connectionString = env_1.default.DIRECT_URL || env_1.default.DATABASE_URL;
exports.pool = new pg_1.Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false
    }
});
exports.pool.on('error', (err) => {
    console.error('Lỗi bất ngờ trong pool kết nối cơ sở dữ liệu:', err);
});
const adapter = new adapter_pg_1.PrismaPg(exports.pool);
// Đảm bảo chỉ có DUY NHẤT MỘT bản sao PrismaClient được tạo ra trong toàn bộ ứng dụng
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
//# sourceMappingURL=prisma.js.map